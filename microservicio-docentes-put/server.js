const http = require("node:http");
const { Buffer } = require("node:buffer");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

// Puerto donde funcionara nuestro microservicio PUT
const PORT = process.env.PORT || 3004;

// Conexion a nuestra base de datos PostgreSQL de Railway
// DATABASE_URL se configurara en Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("proxy.rlwy.net")
    ? { rejectUnauthorized: false }
    : undefined,
});

// Esta funcion envia respuestas en formato JSON
function responder(res, codigo, datos) {
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(datos));
}

// Esta funcion muestra la interfaz visual de Swagger
function mostrarSwagger(res) {
  const pagina = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Swagger PUT - Docentes UNINPAHU</title>

      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
      >
    </head>
    <body>
      <div id="swagger-ui"></div>

      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>

      <script>
        window.onload = function () {
          SwaggerUIBundle({
            url: "/openapi.json",
            dom_id: "#swagger-ui"
          });
        };
      </script>
    </body>
    </html>
  `;

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });

  res.end(pagina);
}

// Esta funcion recibe los datos JSON enviados por Expo
async function recibirJSON(req) {
  const partes = [];
  let tamano = 0;

  // Leemos los datos enviados en la solicitud
  for await (const parte of req) {
    tamano += parte.length;

    // Evitamos recibir archivos demasiado grandes
    if (tamano > 100000) {
      const error = new Error("Datos demasiado grandes");
      error.codigo = 413;
      throw error;
    }

    partes.push(parte);
  }

  try {
    // Convertimos los datos recibidos a un objeto
    const texto = Buffer.concat(partes).toString("utf8");
    return JSON.parse(texto);
  } catch {
    const error = new Error("JSON invalido");
    error.codigo = 400;
    throw error;
  }
}

// Creamos nuestro servidor directamente con Node.js
// No necesitamos Express
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const ruta = url.pathname;

  // Permitimos las solicitudes desde Expo Web
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    return res.end();
  }

  // Ruta para comprobar que funciona el servidor
  if (ruta === "/" && req.method === "GET") {
    return responder(res, 200, {
      mensaje: "Microservicio PUT funcionando correctamente",
      universidad: "UNINPAHU",
    });
  }

  // Ruta para mostrar Swagger
  if (
    (ruta === "/api-docs" || ruta === "/api-docs/") &&
    req.method === "GET"
  ) {
    return mostrarSwagger(res);
  }

  // Ruta que devuelve la documentacion OpenAPI
  if (ruta === "/openapi.json" && req.method === "GET") {
    try {
      // process.cwd() obtiene la carpeta del servicio
      const archivo = path.join(process.cwd(), "swagger.json");

      const swagger = JSON.parse(
        fs.readFileSync(archivo, "utf8")
      );

      return responder(res, 200, swagger);
    } catch (error) {
      console.error("Error Swagger:", error.message);

      return responder(res, 500, {
        error: "No se pudo cargar Swagger",
      });
    }
  }

  // Buscamos el ID del docente en la URL
  // Ejemplo: PUT /docentes/11
  const coincidencia = ruta.match(/^\/docentes\/(\d+)$/);

  // Esta ruta actualiza un docente existente
  if (coincidencia && req.method === "PUT") {
    const id = Number(coincidencia[1]);

    // Validamos que el ID sea correcto
    if (!Number.isSafeInteger(id) || id < 1) {
      return responder(res, 400, {
        error: "ID invalido",
      });
    }

    try {
      // Recibimos los nuevos datos del docente
      const docente = await recibirJSON(req);

      // Comprobamos que sea un objeto JSON
      if (
        !docente ||
        typeof docente !== "object" ||
        Array.isArray(docente)
      ) {
        return responder(res, 400, {
          error: "Debes enviar un objeto JSON",
        });
      }

      // Campos que podemos modificar en PostgreSQL
      const campos = [
        "nombre",
        "imagen",
        "profesion",
        "facultad",
        "materias",
        "correo",
        "experiencia",
        "resumen",
        "perfil",
      ];

      // Solo modificaremos los campos enviados
      const camposEnviados = campos.filter(
        (campo) => docente[campo] !== undefined
      );

      // Debemos recibir al menos un campo
      if (camposEnviados.length === 0) {
        return responder(res, 400, {
          error: "Debes enviar al menos un campo",
        });
      }

      // Comprobamos que los valores sean correctos
      for (const campo of camposEnviados) {
        const valor = docente[campo];

        if (valor !== null && typeof valor !== "string") {
          return responder(res, 400, {
            error: `El campo ${campo} debe ser texto`,
          });
        }

        // Nombre y correo no pueden quedar vacios
        if (
          (campo === "nombre" || campo === "correo") &&
          (typeof valor !== "string" || !valor.trim())
        ) {
          return responder(res, 400, {
            error: `${campo} no puede estar vacio`,
          });
        }
      }

      // Creamos las asignaciones de la consulta SQL
      // Ejemplo: nombre = $1, profesion = $2
      const asignaciones = camposEnviados.map(
        (campo, indice) => `${campo} = $${indice + 1}`
      );

      // Organizamos los nuevos valores
      const valores = camposEnviados.map((campo) => {
        const valor = docente[campo];

        return typeof valor === "string"
          ? valor.trim()
          : null;
      });

      // Agregamos el ID al final de los valores
      valores.push(id);

      // Actualizamos el docente en PostgreSQL
      const resultado = await pool.query(
        `UPDATE docentes
         SET ${asignaciones.join(", ")}
         WHERE id = $${valores.length}
         RETURNING *`,
        valores
      );

      // Comprobamos si encontramos el docente
      if (resultado.rows.length === 0) {
        return responder(res, 404, {
          error: "Docente no encontrado",
        });
      }

      // Respondemos con los datos actualizados
      return responder(res, 200, {
        mensaje: "Docente actualizado correctamente",
        docente: resultado.rows[0],
      });

    } catch (error) {
      console.error("Error al actualizar:", error.message);

      return responder(res, error.codigo || 500, {
        error: error.codigo
          ? error.message
          : "Error al actualizar el docente",
      });
    }
  }

  // Si usan un metodo incorrecto
  if (coincidencia) {
    return responder(res, 405, {
      error: "Metodo no permitido",
    });
  }

  // Si la ruta no existe
  return responder(res, 404, {
    error: "Ruta no encontrada",
  });
});

// Iniciamos nuestro microservicio
servidor.listen(PORT, "0.0.0.0", () => {
  console.log(`Microservicio PUT funcionando en puerto ${PORT}`);
});
