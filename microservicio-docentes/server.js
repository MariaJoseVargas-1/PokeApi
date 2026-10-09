
const http = require("http");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Aqui configuramos el puerto de nuestro servidor
const PORT = process.env.PORT || 3002;

// Aqui conectamos nuestro microservicio con PostgreSQL
// La URL se configura en las variables de Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("proxy.rlwy.net")
    ? { rejectUnauthorized: false }
    : undefined,
});

// Esta funcion nos ayuda a enviar respuestas en formato JSON
function responder(res, codigo, datos) {
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(datos));
}

// Aqui creamos nuestro servidor usando Node.js directamente
// No necesitamos Express
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const ruta = url.pathname;

  // Permitimos las solicitudes desde nuestra aplicacion React
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    return res.end();
  }

  // Solo vamos a utilizar solicitudes GET
  if (req.method !== "GET") {
    return responder(res, 405, {
      error: "Metodo no permitido",
    });
  }

  // Aqui comprobamos que nuestro microservicio funciona
  if (ruta === "/") {
    return responder(res, 200, {
      mensaje: "Microservicio de docentes funcionando correctamente",
      universidad: "UNINPAHU",
    });
  }

  // Aqui mostramos la documentacion OpenAPI de nuestro servicio
  if (ruta === "/openapi.json") {
    try {
      const archivo = path.join(process.cwd(), "swagger.json");
      const swagger = JSON.parse(fs.readFileSync(archivo, "utf8"));

      return responder(res, 200, swagger);
    } catch (error) {
      return responder(res, 500, {
        error: "No se pudo cargar la documentacion",
      });
    }
  }

  // Esta ruta muestra todos los docentes
  if (ruta === "/docentes") {
    try {
      const resultado = await pool.query(
        "SELECT * FROM docentes ORDER BY id"
      );

      return responder(res, 200, resultado.rows);
    } catch (error) {
      console.error("Error al consultar docentes:", error.message);

      return responder(res, 500, {
        error: "Error al consultar la base de datos",
      });
    }
  }

  // Aqui buscamos docentes por nombre usando query params
  // Ejemplo: /docentes/buscar?nombre=Laura
  if (ruta === "/docentes/buscar") {
    const nombre = url.searchParams.get("nombre");

    if (!nombre || !nombre.trim()) {
      return responder(res, 400, {
        error: "Debes escribir el nombre del docente",
      });
    }

    try {
      const resultado = await pool.query(
        "SELECT * FROM docentes WHERE nombre ILIKE $1 ORDER BY id",
        [`%${nombre.trim()}%`]
      );

      return responder(res, 200, resultado.rows);
    } catch (error) {
      console.error("Error al buscar docente:", error.message);

      return responder(res, 500, {
        error: "Error al buscar el docente",
      });
    }
  }

  // Aqui buscamos un docente por su ID usando path params
  // Ejemplo: /docentes/1
  const coincidencia = ruta.match(/^\/docentes\/(\d+)$/);

  if (coincidencia) {
    const id = Number(coincidencia[1]);

    if (!Number.isSafeInteger(id) || id < 1) {
      return responder(res, 400, {
        error: "ID invalido",
      });
    }

    try {
      const resultado = await pool.query(
        "SELECT * FROM docentes WHERE id = $1",
        [id]
      );

      if (resultado.rows.length === 0) {
        return responder(res, 404, {
          error: "Docente no encontrado",
        });
      }

      return responder(res, 200, resultado.rows[0]);
    } catch (error) {
      console.error("Error al consultar docente:", error.message);

      return responder(res, 500, {
        error: "Error al consultar el docente",
      });
    }
  }

  // Si la ruta no existe, mostramos un mensaje
  return responder(res, 404, {
    error: "Ruta no encontrada",
  });
});

// Aqui iniciamos nuestro servidor
servidor.listen(PORT, "0.0.0.0", () => {
  console.log(`Microservicio de docentes funcionando en el puerto ${PORT}`);
});
