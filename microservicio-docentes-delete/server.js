const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

// Puerto del microservicio DELETE
const PORT = process.env.PORT || 3005;

// Conexion a PostgreSQL en Railway.
// En Render configuraremos la variable DATABASE_URL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("proxy.rlwy.net")
    ? { rejectUnauthorized: false }
    : undefined,
});

// Funcion para enviar respuestas JSON
function responder(res, codigo, datos) {
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(datos));
}

// Funcion para mostrar la interfaz de Swagger
function mostrarSwagger(res) {
  const pagina = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Swagger DELETE - Docentes UNINPAHU</title>

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

// Creamos el servidor utilizando Node.js
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const ruta = url.pathname;

  // Permitimos solicitudes desde Expo Web
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    return res.end();
  }

  // Ruta principal para verificar el servidor
  if (ruta === "/" && req.method === "GET") {
    return responder(res, 200, {
      mensaje: "Microservicio DELETE funcionando correctamente",
      universidad: "UNINPAHU",
    });
  }

  // Ruta para visualizar Swagger
  if (
    (ruta === "/api-docs" || ruta === "/api-docs/") &&
    req.method === "GET"
  ) {
    return mostrarSwagger(res);
  }

  // Ruta para entregar el archivo Swagger
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

  // Identificamos el docente por su ID
  // Ejemplo: DELETE /docentes/11
  const coincidencia = ruta.match(/^\/docentes\/(\d+)$/);

  if (coincidencia && req.method === "DELETE") {
    const id = Number(coincidencia[1]);

    // Validamos el ID recibido
    if (!Number.isSafeInteger(id) || id < 1) {
      return responder(res, 400, {
        error: "ID invalido",
      });
    }

    try {
      // Buscamos y eliminamos el docente de PostgreSQL.
      // RETURNING * nos devuelve el registro eliminado.
      const resultado = await pool.query(
        "DELETE FROM docentes WHERE id = $1 RETURNING *",
        [id]
      );

      // Si no existe ese ID, no eliminamos nada
      if (resultado.rows.length === 0) {
        return responder(res, 404, {
          error: "Docente no encontrado",
        });
      }

      // Confirmamos la eliminacion
      return responder(res, 200, {
        mensaje: "Docente eliminado correctamente",
        docente: resultado.rows[0],
      });

    } catch (error) {
      console.error("Error al eliminar:", error.message);

      return responder(res, 500, {
        error: "Error al eliminar el docente",
      });
    }
  }

  // Si se utiliza otro metodo en esta ruta
  if (coincidencia) {
    return responder(res, 405, {
      error: "Metodo no permitido",
    });
  }

  // Ruta inexistente
  return responder(res, 404, {
    error: "Ruta no encontrada",
  });
});

// Iniciamos nuestro microservicio
servidor.listen(PORT, "0.0.0.0", () => {
  console.log(`Microservicio DELETE funcionando en puerto ${PORT}`);
});
