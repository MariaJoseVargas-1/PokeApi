
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Permitir peticiones desde la aplicación
app.use(cors());
app.use(express.json());

// API externa de Naruto
const API_NARUTO = "https://dattebayo-api.onrender.com";

// Ruta principal para comprobar que el servidor funciona
app.get("/", (req, res) => {
    res.json({
        mensaje: "Microservicio de Naruto funcionando"
    });
});

// Buscar personajes de Naruto
app.get("/personajes", async (req, res) => {
    try {
        const nombre = req.query.nombre || "";

        // Construir la dirección de consulta
        const url = `${API_NARUTO}/characters?name=${encodeURIComponent(nombre)}&limit=10`;

        // Consultar la API externa
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            return res.status(respuesta.status).json({
                error: "No se pudieron obtener los personajes"
            });
        }

        const datos = await respuesta.json();

        // Enviar los personajes a la aplicación
        res.json(datos);

    } catch (error) {
        console.error("Error al consultar Naruto:", error);

        res.status(500).json({
            error: "Error al conectar con la API de Naruto"
        });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Microservicio de Naruto funcionando en el puerto ${PORT}`);
});