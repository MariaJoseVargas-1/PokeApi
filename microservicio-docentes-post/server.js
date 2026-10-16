const http = require("node:http");
const { Buffer } = require("node:buffer");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

// Puerto de nuestro microservicio POST.
const PORT = process.env.PORT || 3003;

// Conectamos nuestro microservicio con PostgreSQL de Railway.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("proxy.rlwy.net")
    ? { rejectUnauthorized: false }
    : undefined,
});

// Esta función nos ayuda a enviar respuestas en formato JSON.
function responder(res, codigo, datos) {
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(datos));
}

// Aquí mostramos la página de Swagger.
function mostrarSwagger(res) {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Swagger POST - Docentes UNINPAHU</title>
      <link rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
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

  res.end(html);
}

// Esta función recibe los datos JSON que envía la aplicación.
async function recibirJSON(req) {
  const partes = [];
  let tamano = 0;

  for await (const parte of req) {
    tamano += parte.length;

    // Evitamos recibir datos demasiado grandes.
    if (tamano > 100000) {
      const error = new Error("Datos demasiado grandes");
      error.codigo = 413;
      throw error;
    }

    partes.push(parte);
  }

  try {
    // Convertimos los datos recibidos a JSON.
    const texto = Buffer.concat(partes).toString("utf8");
    return JSON.parse(texto);
  } catch {
    const error = new Error("JSON invalido");
    error.codigo = 400;
    throw error;
  }
}

// Creamos nuestro servidor usando Node.js, sin Express.
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const ruta = url.pathname;

  // Permitimos las solicitudes desde Expo Web.
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    return res.end();
  }

  // Comprobamos que nuestro microservicio funciona.
  if (ruta === "/" && req.method === "GET") {
    return responder(res, 200, {
      mensaje: "Microservicio POST funcionando correctamente",
      universidad: "UNINPAHU",
    });
  }

  // Mostramos Swagger.
  if (
    (ruta === "/api-docs" || ruta === "/api-docs/") &&
    req.method === "GET"
  ) {
    return mostrarSwagger(res);
  }

  // Mostramos la documentación del microservicio.
  if (ruta === "/openapi.json" && req.method === "GET") {
    try {
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

  // Esta ruta nos permite registrar docentes.
  if (ruta === "/docentes" && req.method === "POST") {
    try {
      const docente = await recibirJSON(req);

      // Revisamos que los datos sean un objeto JSON.
      if (
        !docente ||
        typeof docente !== "object" ||
        Array.isArray(docente)
      ) {
        return responder(res, 400, {
          error: "Debes enviar un objeto JSON",
        });
      }

      // Estos son los campos de nuestros docentes.
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

      // El nombre y el correo son obligatorios.
      if (
        typeof docente.nombre !== "string" ||
        !docente.nombre.trim() ||
        typeof docente.correo !== "string" ||
        !docente.correo.trim()
      ) {
        return responder(res, 400, {
          error: "Nombre y correo son obligatorios",
        });
      }

      // Comprobamos que todos los campos sean textos.
      for (const campo of campos) {
        if (
          docente[campo] !== undefined &&
          docente[campo] !== null &&
          typeof docente[campo] !== "string"
        ) {
          return responder(res, 400, {
            error: `El campo ${campo} debe ser texto`,
          });
        }
      }

      // Organizamos los datos antes de enviarlos a PostgreSQL.
      const valores = campos.map((campo) => {
        const valor = docente[campo];

        return typeof valor === "string"
          ? valor.trim()
          : null;
      });

      // Registramos el docente en PostgreSQL.
      const resultado = await pool.query(
        `INSERT INTO docentes
        (nombre, imagen, profesion, facultad, materias,
         correo, experiencia, resumen, perfil)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
        valores
      );

      // Si todo salió bien, devolvemos el docente registrado.
      return responder(res, 201, {
        mensaje: "Docente registrado correctamente",
        docente: resultado.rows[0],
      });

    } catch (error) {
      // Si el correo ya existe, PostgreSQL nos avisa con este código.
      if (error.code === "23505") {
        return responder(res, 409, {
          error: "Ya existe un docente registrado con ese correo.",
        });
      }

      // Si ocurre otro error, lo mostramos en la consola.
      console.error("Error POST:", error.message);

      return responder(res, error.codigo || 500, {
        error: error.codigo
          ? error.message
          : "Error al registrar docente",
      });
    }
  }

  // Si intentan usar otro método en esta ruta, lo rechazamos.
  if (ruta === "/docentes") {
    return responder(res, 405, {
      error: "Metodo no permitido",
    });
  }

  // Si la ruta no existe, mostramos este mensaje.
  return responder(res, 404, {
    error: "Ruta no encontrada",
  });
});

// Aquí iniciamos nuestro microservicio.
servidor.listen(PORT, "0.0.0.0", () => {
  console.log(`Microservicio POST funcionando en puerto ${PORT}`);
});