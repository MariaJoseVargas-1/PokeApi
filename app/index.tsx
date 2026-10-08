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

// ======================================================
// CONEXIÓN CON NUESTRO MICROSERVICIO EN RAILWAY
// ======================================================

// Esta es la dirección pública de nuestro microservicio Node.js.
// El microservicio consulta los Pokémon guardados en PostgreSQL.
const API_URL =
  "https://microservicio-pokemon-production.up.railway.app";

// ======================================================
// COLORES DE LOS TIPOS DE POKÉMON
// ======================================================

// Cada tipo tiene un color diferente.
// Por ejemplo: fuego es naranja y agua es azul.
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

// ======================================================
// NOMBRES DE LOS TIPOS EN ESPAÑOL
// ======================================================

// La base de datos guarda algunos tipos en inglés.
// Aquí los traducimos para mostrarlos en la aplicación.
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

// ======================================================
// ICONOS DE RESPALDO
// ======================================================

// Si un tipo no tiene imagen, mostramos un icono.
// Así evitamos que la tarjeta quede completamente vacía.
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

// ======================================================
// COMPONENTE PRINCIPAL DE LA POKÉDEX
// ======================================================

export default function Principal() {

  // Guarda el nombre que escribe el usuario.
  const [nombre, setNombre] = useState("");

  // Indica si estamos esperando una respuesta del servidor.
  const [cargando, setCargando] = useState(false);

  // Guarda los mensajes de error.
  const [error, setError] = useState("");

  // usePokemon permite compartir la información del Pokémon
  // con la pantalla "Datos".
  const { pokemonData, setPokemonData } = usePokemon();

  // ====================================================
  // FUNCIÓN PARA BUSCAR UN POKÉMON
  // ====================================================

  const buscarPokemon = async () => {

    // Quitamos los espacios al principio y al final.
    const nombreBuscado = nombre.trim();

    // Comprobamos que el usuario haya escrito un nombre.
    if (nombreBuscado === "") {
      setError("Escribe el nombre de un Pokémon.");
      return;
    }

    try {

      // Activamos el indicador de carga.
      setCargando(true);

      // Borramos cualquier error anterior.
      setError("");

      // Construimos la URL de búsqueda.
      //
      // /pokemon/buscar/:nombre es la ruta que creamos
      // en nuestro microservicio Node.js.
      //
      // encodeURIComponent prepara el nombre para
      // enviarlo correctamente dentro de la URL.
      const url =
        `${API_URL}/pokemon/buscar/${encodeURIComponent(nombreBuscado)}`;

      // fetch envía la petición al microservicio en Railway.
      const respuesta = await fetch(url);

      // Convertimos la respuesta del servidor a JSON.
      const datos = await respuesta.json();

      // Si el servidor no encontró el Pokémon,
      // mostramos un mensaje de error.
      if (!respuesta.ok) {
        setPokemonData(null);

        setError(
          datos.mensaje ||
          datos.detail ||
          "No se encontró el Pokémon."
        );

        return;
      }

      // Guardamos la información del Pokémon encontrado.
      //
      // Estos datos vienen de nuestra base de datos
      // PostgreSQL a través del microservicio.
      setPokemonData(datos);

    } catch (error) {

      // Este mensaje aparece si falla la conexión
      // con nuestro microservicio.
      setPokemonData(null);

      setError(
        "No se pudo conectar con el servidor de Railway."
      );

    } finally {

      // Dejamos de mostrar el indicador de carga,
      // tanto si la búsqueda funcionó como si falló.
      setCargando(false);
    }
  };

  // ====================================================
  // INFORMACIÓN DEL TIPO DEL POKÉMON
  // ====================================================

  // Obtenemos el primer tipo del Pokémon.
  // El signo ? evita errores si todavía no hay datos.
  const tipoPrincipal = pokemonData?.tipos?.[0];

  // Elegimos el color correspondiente al tipo.
  // Si no existe, usamos el azul de nuestra aplicación.
  const colorTipo = tipoPrincipal
    ? coloresTipos[tipoPrincipal.nombre] || "#2878D0"
    : "#2878D0";

  // ====================================================
  // DISEÑO DE LA PANTALLA
  // ====================================================

  return (
    <ScrollView
      style={estilos.fondo}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >

      {/* ============================================= */}
      {/* ENCABEZADO DE LA POKÉDEX                      */}
      {/* ============================================= */}

      <View style={estilos.encabezado}>

        {/* Imagen de la Pokébola */}
        <Image
          source={{
            uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
          }}
          style={estilos.pokebola}
        />

        <Text style={estilos.titulo}>
          Pokédex
        </Text>

        <Text style={estilos.subtitulo}>
          ¡Encuentra tu Pokémon favorito!
        </Text>

      </View>

      {/* ============================================= */}
      {/* BUSCADOR                                      */}
      {/* ============================================= */}

      <View style={estilos.buscador}>

        {/* Aquí el usuario escribe el nombre */}
        <TextInput
          style={estilos.entrada}
          placeholder="Nombre del Pokémon"
          placeholderTextColor="#91A8C4"
          value={nombre}
          onChangeText={setNombre}
          onSubmitEditing={buscarPokemon}
          autoCapitalize="none"
        />

        {/* Botón para realizar la búsqueda */}
        <TouchableOpacity
          style={estilos.botonBuscar}
          onPress={buscarPokemon}
          disabled={cargando}
        >
          <FontAwesome
            name="search"
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>

      </View>

      {/* ============================================= */}
      {/* MENSAJE DE ERROR                              */}
      {/* ============================================= */}

      {/* Solo aparece cuando existe un error */}
      {error !== "" && (
        <View style={estilos.errorContenedor}>
          <Text style={estilos.errorTexto}>
            {error}
          </Text>
        </View>
      )}

      {/* ============================================= */}
      {/* INDICADOR DE CARGA                            */}
      {/* ============================================= */}

      {/* Aparece mientras esperamos al servidor */}
      {cargando && (
        <ActivityIndicator
          size="large"
          color="#2878D0"
          style={estilos.cargando}
        />
      )}

      {/* ============================================= */}
      {/* TARJETA PRINCIPAL DEL POKÉMON                  */}
      {/* ============================================= */}

      {/* Mostramos esta sección cuando hay datos */}
      {pokemonData && !cargando && (

        <View style={estilos.tarjetaPrincipal}>

          {/* Nombre del Pokémon */}
          <Text style={estilos.nombrePokemon}>
            {pokemonData.nombre}
          </Text>

          {/* ======================================= */}
          {/* IMAGEN 1: POKÉMON PRINCIPAL             */}
          {/* ======================================= */}

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

          {/* ======================================= */}
          {/* TARJETAS INFERIORES                     */}
          {/* ======================================= */}

          <View style={estilos.filaImagenes}>

            {/* ===================================== */}
            {/* IMAGEN 2: TIPO DEL POKÉMON            */}
            {/* ===================================== */}

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

                  {/* Imagen del tipo, si existe */}
                  {tipoPrincipal.imagen ? (

                    <Image
                      source={{
                        uri: tipoPrincipal.imagen,
                      }}
                      style={estilos.imagenTipo}
                      resizeMode="contain"
                    />

                  ) : (

                    // Si no hay imagen, usamos un icono.
                    <FontAwesome
                      name={
                        (
                          iconosTipos[tipoPrincipal.nombre] ||
                          "question-circle"
                        ) as any
                      }
                      size={38}
                      color="#FFFFFF"
                    />

                  )}

                  {/* Nombre del tipo en español */}
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

              {/* Segundo tipo, si el Pokémon tiene dos */}
              {(pokemonData.tipos?.length || 0) > 1 && (

                <Text style={estilos.tipoSecundario}>
                  {nombresTipos[pokemonData.tipos[1].nombre] ||
                    pokemonData.tipos[1].nombre}
                </Text>

              )}

            </View>

            {/* ===================================== */}
            {/* IMAGEN 3: EVOLUCIÓN DEL POKÉMON       */}
            {/* ===================================== */}

            <View style={estilos.tarjetaInferior}>

              <Text style={estilos.tituloTarjeta}>
                Evolución
              </Text>

              {pokemonData.evolucion ? (

                <>

                  {/* Imagen de la evolución */}
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

                  {/* Nombre de la evolución */}
                  <Text style={estilos.nombreEvolucion}>
                    {pokemonData.evolucion.nombre}
                  </Text>

                </>

              ) : (

                // Algunos Pokémon no tienen evolución.
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

      {/* ============================================= */}
      {/* MENSAJE INICIAL                               */}
      {/* ============================================= */}

      {/* Aparece cuando todavía no hemos buscado nada */}
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

// ======================================================
// ESTILOS DE LA APLICACIÓN
// ======================================================

// StyleSheet.create permite organizar los colores,
// tamaños, bordes y posiciones de los componentes.
//
// Conservamos el diseño azul de la Pokédex original.

const estilos = StyleSheet.create({

  // Fondo general de la pantalla.
  fondo: {
    flex: 1,
    backgroundColor: "#EAF3FF",
  },

  // Espacio alrededor de todo el contenido.
  contenedor: {
    padding: 20,
    paddingBottom: 35,
  },

  // Encabezado donde aparece la Pokébola.
  encabezado: {
    alignItems: "center",
    marginBottom: 22,
  },

  // Tamaño de la Pokébola.
  pokebola: {
    width: 45,
    height: 45,
    marginBottom: 5,
  },

  // Título principal.
  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2878D0",
  },

  // Texto debajo del título.
  subtitulo: {
    fontSize: 14,
    color: "#7189A8",
    marginTop: 4,
  },

  // Caja que contiene el buscador.
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

  // Campo donde escribimos el nombre.
  entrada: {
    flex: 1,
    height: 45,
    paddingHorizontal: 12,
    color: "#263D59",
    fontSize: 15,
  },

  // Botón azul de búsqueda.
  botonBuscar: {
    width: 45,
    height: 45,
    backgroundColor: "#2878D0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Fondo del mensaje de error.
  errorContenedor: {
    backgroundColor: "#FFE8E8",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },

  // Texto rojo del mensaje de error.
  errorTexto: {
    color: "#C62828",
    textAlign: "center",
    fontSize: 14,
  },

  // Espacio del indicador de carga.
  cargando: {
    marginVertical: 25,
  },

  // Tarjeta blanca donde mostramos el Pokémon.
  tarjetaPrincipal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: "#D2E5FA",
    elevation: 3,
  },

  // Nombre del Pokémon encontrado.
  nombrePokemon: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2878D0",
    textAlign: "center",
    marginBottom: 12,
  },

  // Recuadro grande de la imagen principal.
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

  // Tamaño de la imagen del Pokémon.
  imagenPrincipal: {
    width: "95%",
    height: "95%",
  },

  // Texto cuando no hay imagen.
  sinImagen: {
    color: "#7189A8",
    fontSize: 14,
  },

  // Organiza las dos tarjetas inferiores.
  filaImagenes: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  // Estilo compartido por las tarjetas de tipo y evolución.
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

  // Título de las tarjetas inferiores.
  tituloTarjeta: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2878D0",
    marginBottom: 8,
  },

  // Recuadro coloreado según el tipo.
  contenedorTipo: {
    width: "100%",
    minHeight: 95,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  // Imagen que representa el tipo.
  imagenTipo: {
    width: "100%",
    height: 55,
  },

  // Nombre del tipo dentro de la tarjeta.
  nombreTipo: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 5,
  },

  // Texto del segundo tipo, si existe.
  tipoSecundario: {
    color: "#2878D0",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 5,
  },

  // Imagen de la evolución.
  imagenEvolucion: {
    width: "100%",
    height: 95,
  },

  // Nombre de la evolución.
  nombreEvolucion: {
    color: "#2878D0",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
  },

  // Contenedor cuando no existe evolución.
  sinEvolucion: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  // Mensajes pequeños de las tarjetas.
  textoVacio: {
    color: "#7189A8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },

  // Contenedor del mensaje antes de buscar.
  mensajeInicial: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },

  // Texto del mensaje inicial.
  textoInicial: {
    color: "#7189A8",
    fontSize: 15,
    textAlign: "center",
    marginTop: 15,
  },

});
