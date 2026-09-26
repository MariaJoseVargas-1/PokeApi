import { FontAwesome } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePokemon } from "../context/PokemonContext";

// Colores según el tipo de Pokémon
const coloresTipos: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

// Nombres de los tipos en español
const nombresTipos: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

// Iconos de respaldo si no se encuentra la imagen del tipo
const iconosTipos: Record<string, string> = {
  normal: "circle",
  fire: "fire",
  water: "tint",
  electric: "bolt",
  grass: "leaf",
  ice: "snowflake-o",
  fighting: "hand-rock-o",
  poison: "flask",
  ground: "globe",
  flying: "plane",
  psychic: "eye",
  bug: "bug",
  rock: "diamond",
  ghost: "moon-o",
  dragon: "superpowers",
  dark: "moon-o",
  steel: "cog",
  fairy: "star",
};

export default function Principal() {
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const { pokemonData, setPokemonData } = usePokemon();

  // Buscar el Pokémon en el microservicio
  const buscarPokemon = async () => {
    if (nombre.trim() === "") {
      setError("Escribe el nombre de un Pokémon.");
      return;
    }

    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(
      `http://10.148.18.133:3000/pokemon/${nombre.trim().toLowerCase()}`
     );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setPokemonData(null);
        setError(datos.mensaje || "No se encontró el Pokémon.");
        return;
      }

      setPokemonData(datos);
    } catch (error) {
      setError(
        "No se pudo conectar con el servidor. Verifica que esté funcionando."
      );
    } finally {
      setCargando(false);
    }
  };

  // Obtener el primer tipo del Pokémon
  const tipoPrincipal = pokemonData?.tipos?.[0];

  // Color de la tarjeta según el tipo
  const colorTipo = tipoPrincipal
    ? coloresTipos[tipoPrincipal.nombre] || "#2878D0"
    : "#2878D0";

  return (
    <ScrollView
      style={estilos.fondo}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      {/* Encabezado */}
      <View style={estilos.encabezado}>
        <Image
          source={{
            uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
          }}
          style={estilos.pokebola}
        />

        <Text style={estilos.titulo}>Pokédex</Text>
        <Text style={estilos.subtitulo}>
          ¡Encuentra tu Pokémon favorito!
        </Text>
      </View>

      {/* Buscador */}
      <View style={estilos.buscador}>
        <TextInput
          style={estilos.entrada}
          placeholder="Nombre del Pokémon"
          placeholderTextColor="#91A8C4"
          value={nombre}
          onChangeText={setNombre}
          onSubmitEditing={buscarPokemon}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={estilos.botonBuscar}
          onPress={buscarPokemon}
          disabled={cargando}
        >
          <FontAwesome name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Mensaje de error */}
      {error !== "" && (
        <View style={estilos.errorContenedor}>
          <Text style={estilos.errorTexto}>{error}</Text>
        </View>
      )}

      {/* Indicador de carga */}
      {cargando && (
        <ActivityIndicator
          size="large"
          color="#2878D0"
          style={estilos.cargando}
        />
      )}

      {/* Tarjeta principal */}
      {pokemonData && !cargando && (
        <View style={estilos.tarjetaPrincipal}>
          <Text style={estilos.nombrePokemon}>
            {pokemonData.nombre}
          </Text>

          {/* IMAGEN 1: Pokémon principal */}
          <View style={estilos.imagenPrincipalContenedor}>
            {pokemonData.imagen ? (
              <Image
                source={{ uri: pokemonData.imagen }}
                style={estilos.imagenPrincipal}
                resizeMode="contain"
              />
            ) : (
              <Text style={estilos.sinImagen}>
                Imagen no disponible
              </Text>
            )}
          </View>

          {/* DOS TARJETAS INFERIORES */}
          <View style={estilos.filaImagenes}>
            {/* IMAGEN 2: Tipo del Pokémon */}
            <View style={estilos.tarjetaInferior}>
              <Text style={estilos.tituloTarjeta}>
                Tipo
              </Text>

              {tipoPrincipal ? (
                <View
                  style={[
                    estilos.contenedorTipo,
                    { backgroundColor: colorTipo },
                  ]}
                >
                  {tipoPrincipal.imagen ? (
                    <Image
                      source={{ uri: tipoPrincipal.imagen }}
                      style={estilos.imagenTipo}
                      resizeMode="contain"
                    />
                  ) : (
                    <FontAwesome
                      name={
                        (iconosTipos[tipoPrincipal.nombre] ||
                          "question-circle") as any
                      }
                      size={38}
                      color="#FFFFFF"
                    />
                  )}

                  <Text style={estilos.nombreTipo}>
                    {nombresTipos[tipoPrincipal.nombre] ||
                      tipoPrincipal.nombre}
                  </Text>
                </View>
              ) : (
                <Text style={estilos.textoVacio}>
                  Sin tipo
                </Text>
              )}

              {/* Mostrar el segundo tipo si existe */}
              {pokemonData.tipos.length > 1 && (
                <Text style={estilos.tipoSecundario}>
                  {nombresTipos[pokemonData.tipos[1].nombre] ||
                    pokemonData.tipos[1].nombre}
                </Text>
              )}
            </View>

            {/* IMAGEN 3: Evolución del Pokémon */}
            <View style={estilos.tarjetaInferior}>
              <Text style={estilos.tituloTarjeta}>
                Evolución
              </Text>

              {pokemonData.evolucion ? (
                <>
                  {pokemonData.evolucion.imagen ? (
                    <Image
                      source={{
                        uri: pokemonData.evolucion.imagen,
                      }}
                      style={estilos.imagenEvolucion}
                      resizeMode="contain"
                    />
                  ) : (
                    <FontAwesome
                      name="question-circle"
                      size={55}
                      color="#91A8C4"
                    />
                  )}

                  <Text style={estilos.nombreEvolucion}>
                    {pokemonData.evolucion.nombre}
                  </Text>
                </>
              ) : (
                <View style={estilos.sinEvolucion}>
                  <FontAwesome
                    name="star"
                    size={30}
                    color="#91A8C4"
                  />
                  <Text style={estilos.textoVacio}>
                    No evoluciona
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Mensaje inicial */}
      {!pokemonData && !cargando && error === "" && (
        <View style={estilos.mensajeInicial}>
          <FontAwesome
            name="search"
            size={42}
            color="#91A8C4"
          />
          <Text style={estilos.textoInicial}>
            Busca un Pokémon para ver sus imágenes
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "#EAF3FF",
  },

  contenedor: {
    padding: 20,
    paddingBottom: 35,
  },

  encabezado: {
    alignItems: "center",
    marginBottom: 22,
  },

  pokebola: {
    width: 45,
    height: 45,
    marginBottom: 5,
  },

  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2878D0",
  },

  subtitulo: {
    fontSize: 14,
    color: "#7189A8",
    marginTop: 4,
  },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#2878D0",
    padding: 5,
    marginBottom: 18,
  },

  entrada: {
    flex: 1,
    height: 45,
    paddingHorizontal: 12,
    color: "#263D59",
    fontSize: 15,
  },

  botonBuscar: {
    width: 45,
    height: 45,
    backgroundColor: "#2878D0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  errorContenedor: {
    backgroundColor: "#FFE8E8",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },

  errorTexto: {
    color: "#C62828",
    textAlign: "center",
    fontSize: 14,
  },

  cargando: {
    marginVertical: 25,
  },

  tarjetaPrincipal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: "#D2E5FA",
    elevation: 3,
  },

  nombrePokemon: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2878D0",
    textAlign: "center",
    marginBottom: 12,
  },

  imagenPrincipalContenedor: {
    width: "100%",
    height: 230,
    backgroundColor: "#F4F9FF",
    borderWidth: 3,
    borderColor: "#2998E8",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    marginBottom: 12,
  },

  imagenPrincipal: {
    width: "95%",
    height: "95%",
  },

  sinImagen: {
    color: "#7189A8",
    fontSize: 14,
  },

  filaImagenes: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  tarjetaInferior: {
    flex: 1,
    minHeight: 165,
    backgroundColor: "#F4F9FF",
    borderWidth: 3,
    borderColor: "#2998E8",
    borderRadius: 5,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  tituloTarjeta: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2878D0",
    marginBottom: 8,
  },

  contenedorTipo: {
    width: "100%",
    minHeight: 95,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  imagenTipo: {
    width: "100%",
    height: 55,
  },

  nombreTipo: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 5,
  },

  tipoSecundario: {
    color: "#2878D0",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 5,
  },

  imagenEvolucion: {
    width: "100%",
    height: 95,
  },

  nombreEvolucion: {
    color: "#2878D0",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
  },

  sinEvolucion: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  textoVacio: {
    color: "#7189A8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },

  mensajeInicial: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },

  textoInicial: {
    color: "#7189A8",
    fontSize: 15,
    textAlign: "center",
    marginTop: 15,
  },
});