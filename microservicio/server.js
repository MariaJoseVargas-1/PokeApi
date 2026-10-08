
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = process.env.PORT || 3000;

// Permitir que React y Expo consulten nuestro microservicio
app.use(cors());
app.use(express.json());

// Conexión con PostgreSQL de Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API de Pokémon",
            version: "1.1.0",
            description: "Microservicio Node.js conectado a PostgreSQL con información completa de 10 Pokémon"
        }
    },
    apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Comprueba que el microservicio funciona
 *     responses:
 *       200:
 *         description: Microservicio funcionando correctamente
 */
app.get("/", (req, res) => {
    res.json({
        mensaje: "Microservicio Pokémon funcionando correctamente"
    });
});

/**
 * @swagger
 * /pokemon:
 *   get:
 *     summary: Obtiene todos los Pokémon almacenados
 *     responses:
 *       200:
 *         description: Lista de Pokémon con imágenes, estadísticas y movimientos
 *       500:
 *         description: Error de base de datos
 */
app.get("/pokemon", async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT * FROM pokemon ORDER BY id"
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error("Error al consultar Pokémon:", error);

        res.status(500).json({
            error: "Error al consultar la base de datos"
        });
    }
});

/**
 * @swagger
 * /pokemon/buscar/{nombre}:
 *   get:
 *     summary: Busca un Pokémon por su nombre
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *         example: Pikachu
 *     responses:
 *       200:
 *         description: Pokémon encontrado
 *       404:
 *         description: Pokémon no encontrado
 *       500:
 *         description: Error de base de datos
 */
app.get("/pokemon/buscar/:nombre", async (req, res) => {
    try {
        const nombre = req.params.nombre.trim();

        // LOWER permite buscar sin importar mayúsculas o minúsculas
        const resultado = await pool.query(
            "SELECT * FROM pokemon WHERE LOWER(nombre) = LOWER($1)",
            [nombre]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Pokémon no encontrado"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al buscar Pokémon:", error);

        res.status(500).json({
            error: "Error al consultar la base de datos"
        });
    }
});

/**
 * @swagger
 * /pokemon/{id}:
 *   get:
 *     summary: Obtiene un Pokémon por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Pokémon encontrado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Pokémon no encontrado
 *       500:
 *         description: Error de base de datos
 */
app.get("/pokemon/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        // Validar que el ID sea un número entero positivo
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: "ID inválido"
            });
        }

        const resultado = await pool.query(
            "SELECT * FROM pokemon WHERE id = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Pokémon no encontrado"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error("Error al consultar Pokémon:", error);

        res.status(500).json({
            error: "Error al consultar la base de datos"
        });
    }
});

// Iniciar el microservicio
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});
