const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

const PORT = process.env.PORT || 3000;

// Permitir peticiones desde otras aplicaciones
app.use(cors());
app.use(express.json());

// Conexión con PostgreSQL
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
            version: "1.0.0",
            description: "Microservicio propio para consultar Pokémon almacenados en PostgreSQL"
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
 *     summary: Obtiene los 10 Pokémon almacenados
 *     responses:
 *       200:
 *         description: Lista de Pokémon
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
 * /pokemon/{id}:
 *   get:
 *     summary: Obtiene un Pokémon por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pokémon encontrado
 *       404:
 *         description: Pokémon no encontrado
 */
app.get("/pokemon/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            "SELECT * FROM pokemon WHERE id = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: "Pokémon no encontrado"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
    console.error("ERROR REAL:", error);

    res.status(500).json({
        error: error.message
    });
}
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});