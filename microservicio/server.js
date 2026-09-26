const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Ruta inicial para comprobar que el servidor funciona
app.get("/", (req, res) => {
  res.send("Microservicio Pokémon funcionando correctamente");
});

// Busca un Pokémon dentro de la cadena de evolución
function buscarPokemonEnCadena(cadena, nombre) {
  if (cadena.species.name === nombre) {
    return cadena;
  }

  for (const evolucion of cadena.evolves_to) {
    const resultado = buscarPokemonEnCadena(evolucion, nombre);

    if (resultado) {
      return resultado;
    }
  }

  return null;
}

// Busca la siguiente evolución del Pokémon
function obtenerSiguienteEvolucion(cadena) {
  if (cadena.evolves_to.length > 0) {
    return cadena.evolves_to[0].species.name;
  }

  return null;
}

// Convierte la primera letra en mayúscula
function primeraMayuscula(texto) {
  if (!texto) return "";

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Ruta para buscar un Pokémon por nombre
app.get("/pokemon/:nombre", async (req, res) => {
  try {
    const nombre = req.params.nombre.toLowerCase();

    // 1. Obtener información principal del Pokémon
    const respuestaPokemon = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${nombre}`
    );

    if (!respuestaPokemon.ok) {
      return res.status(404).json({
        mensaje: "No se encontró el Pokémon",
      });
    }

    const pokemon = await respuestaPokemon.json();

    // 2. Obtener información de su especie
    const respuestaEspecie = await fetch(pokemon.species.url);
    const especie = await respuestaEspecie.json();

    // Buscar el nombre de la especie en español
    const nombreEspecie =
      especie.genera.find((item) => item.language.name === "es")?.genus ||
      especie.genera.find((item) => item.language.name === "en")?.genus ||
      "No disponible";

    // 3. Obtener la cadena de evolución
    const respuestaCadena = await fetch(especie.evolution_chain.url);
    const cadenaEvolucion = await respuestaCadena.json();

    // Buscar el Pokémon actual dentro de la cadena
    const pokemonEnCadena = buscarPokemonEnCadena(
      cadenaEvolucion.chain,
      nombre
    );

    let evolucion = null;

    // Si tiene una evolución siguiente, obtener su imagen
    if (pokemonEnCadena) {
      const nombreEvolucion = obtenerSiguienteEvolucion(pokemonEnCadena);

      if (nombreEvolucion) {
        const respuestaEvolucion = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${nombreEvolucion}`
        );

        if (respuestaEvolucion.ok) {
          const datosEvolucion = await respuestaEvolucion.json();

          evolucion = {
            nombre: primeraMayuscula(datosEvolucion.name),
            imagen:
              datosEvolucion.sprites.other?.["official-artwork"]
                ?.front_default ||
              datosEvolucion.sprites.front_default ||
              null,
          };
        }
      }
    }

    // 4. Obtener los tipos y sus imágenes
    const tipos = await Promise.all(
      pokemon.types.map(async (item) => {
        const respuestaTipo = await fetch(item.type.url);
        const datosTipo = await respuestaTipo.json();

        const imagenTipo =
          datosTipo.sprites?.["generation-ix"]?.["scarlet-violet"]
            ?.name_icon ||
          datosTipo.sprites?.["generation-viii"]?.["sword-shield"]
            ?.name_icon ||
          null;

        return {
          nombre: item.type.name,
          imagen: imagenTipo,
        };
      })
    );

    // 5. Preparar todos los datos
    const datos = {
      nombre: primeraMayuscula(pokemon.name),

      altura: pokemon.height,
      peso: pokemon.weight,

      imagen:
        pokemon.sprites.other?.["official-artwork"]?.front_default ||
        pokemon.sprites.front_default ||
        null,

      especie: nombreEspecie,

      movimientos: pokemon.moves.map((item) => item.move.name),

      estadisticas: pokemon.stats.map((item) => ({
        nombre: item.stat.name,
        valor: item.base_stat,
      })),

      tipos: tipos,

      evolucion: evolucion,
    };

    // 6. Enviar los datos a la aplicación
    res.json(datos);
  } catch (error) {
    console.error("Error al buscar el Pokémon:", error);

    res.status(500).json({
      mensaje: "Error al obtener los datos del Pokémon",
    });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});