
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

import {
  PersonajeNaruto,
  useNaruto,
} from "../context/NarutoContext";

// Aqui esta la conexion con nuestro microservicio de Naruto en Railway
// El microservicio esta hecho en Python y consulta MongoDB
const API_URL =
  "https://microservicio-naruto-production.up.railway.app";

// Aqui se traducen algunas tecnicas que pueden venir en ingles
const traducirTecnica = (tecnica: string): string => {
  const traducciones: Record<string, string> = {
    "All Directions Shuriken": "Shuriken en todas las direcciones",
    "Baryon Mode": "Modo Barión",
    "Shadow Clone Technique": "Técnica de clones de sombra",
    "Sexy Technique": "Técnica sexy",
    "Summoning Technique": "Técnica de invocación",
    "Fire Release": "Liberación de fuego",
    "Wind Release": "Liberación de viento",
    "Lightning Release": "Liberación de rayo",
    "Earth Release": "Liberación de tierra",
    "Water Release": "Liberación de agua",
  };

  // Si no tiene traduccion, se deja como esta
  return traducciones[tecnica] || tecnica;
};

// Esta funcion sirve para manejar los datos como listas
// Por ejemplo, las tecnicas o los tipos de chakra
const convertirLista = (valor: any): string[] => {
  if (Array.isArray(valor)) {
    return valor
      .map((item) =>
        typeof item === "string" ? item : item?.name || ""
      )
      .filter(Boolean);
  }

  // Si viene un solo texto, lo metemos en una lista
  if (typeof valor === "string" && valor.trim() !== "") {
    return [valor];
  }

  // Si no hay datos, devolvemos una lista vacia
  return [];
};

// Pantalla principal de la API de Naruto
export default function Api2() {

  // Aqui guardamos lo que escribe el usuario
  const [nombre, setNombre] = useState("");

  // Para saber cuando esta cargando la busqueda
  const [cargando, setCargando] = useState(false);

  // Aqui guardamos los errores
  const [error, setError] = useState("");

  // Con el contexto compartimos el personaje con Datos 2
  const { personaje, setPersonaje } = useNaruto();

  // Funcion para buscar el personaje
  const buscarPersonaje = async () => {

    // Quitamos los espacios del nombre
    const nombreBuscado = nombre.trim();

    // Revisamos que el usuario haya escrito algo
    if (nombreBuscado === "") {
      setError("Escribe el nombre de un personaje.");
      return;
    }

    try {
      // Mostramos que esta cargando y limpiamos errores anteriores
      setCargando(true);
      setError("");

      // Aqui usamos la ruta de busqueda de nuestro microservicio
      // Por ejemplo: /personajes/buscar?nombre=Naruto
      const url =
        `${API_URL}/personajes/buscar?nombre=${encodeURIComponent(nombreBuscado)}`;

      // Aqui consultamos nuestro microservicio de Railway
const respuesta = await fetch(url);

// Mostramos en consola la respuesta del servidor
console.log("Estado de Railway:", respuesta.status);

// Revisamos si la consulta funciono
if (!respuesta.ok) {
  const mensaje = await respuesta.text();
  throw new Error(`Error ${respuesta.status}: ${mensaje}`);
}

      // Pasamos la respuesta a JSON
      const datos = await respuesta.json();

      // Nuestro microservicio devuelve una lista de personajes
      const lista = Array.isArray(datos) ? datos : [];

      // Tomamos el primer personaje que encontro la busqueda
      const encontrado = lista[0];

      // Si no encontro ninguno, mostramos un mensaje
      if (!encontrado) {
        setPersonaje(null);
        setError("No se encontró el personaje.");
        return;
      }

      // Aqui tomamos la informacion personal guardada en MongoDB
      const informacion = encontrado.informacionPersonal || {};

      // Convertimos las habilidades especiales en una lista
      const habilidades = convertirLista(
        encontrado.habilidadesEspeciales
      );

      // Aqui organizamos los datos que llegan de MongoDB
      // para que funcionen con nuestro contexto de Naruto
      const nuevoPersonaje: PersonajeNaruto = {

        // Identificador del personaje en MongoDB
        id: encontrado._id,

        // Nombre del personaje
        name: encontrado.nombre || "Sin nombre",

        // Guardamos la imagen en una lista para usarla en React
        images: encontrado.imagen
          ? [encontrado.imagen]
          : [],

        // Clan del personaje
        clan: encontrado.clan || "",

        // Aldea a la que pertenece
        village: informacion.aldea || "",

        // Tecnicas del personaje
        jutsu: convertirLista(encontrado.tecnicas),

        // Naturalezas del chakra
        natureType: convertirLista(
          encontrado.naturalezaChakra
        ),

        // Rango ninja
        rank: encontrado.rango || "",

        // Poder principal del personaje
        description: encontrado.poderPrincipal || "",

        // Aldea u organizacion
        affiliation: convertirLista(
          informacion.organizacion || informacion.aldea
        ),

        // Familia del personaje
        family: encontrado.familia || {},

        // Informacion personal para mostrar en Datos 2
        personal: {
          sex: informacion.sexo || "",
          birthdate: informacion.cumpleanos || "",
          species: informacion.especie || "",
          affiliation: informacion.aldea || "",
          classification: informacion.bestiaConCola || "",
          organization: informacion.organizacion || "",
        },

        // Estos campos se dejan para mantener el contexto
        debut: {},
        tools: [],

        // Habilidades especiales
        uniqueTraits: habilidades,

        kekkeiGenkai: [],

        classification: informacion.bestiaConCola || "",
      };

      // Guardamos el personaje para mostrarlo aqui y en Datos 2
      setPersonaje(nuevoPersonaje);

    } catch (e) {

      // Si hay problemas con la conexion, mostramos el error
      console.error("Error al buscar personaje:", e);

      setPersonaje(null);

      // Aqui mostramos el error real para saber que esta fallando
setError(
  e instanceof Error ? e.message : "Error desconocido"
);
    } finally {

      // Quitamos el indicador de carga al terminar
      setCargando(false);
    }
  };

  return (
    <ScrollView
      style={estilos.fondo}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >

      {/* Encabezado de la pantalla */}
      <View style={estilos.encabezado}>

        <FontAwesome
          name="leaf"
          size={42}
          color="#2878D0"
        />

        <Text style={estilos.titulo}>
          Bienvenido a la aldea
        </Text>

        <Text style={estilos.subtitulo}>
          Busca un ninja
        </Text>

      </View>

      {/* Aqui esta el buscador */}
      <View style={estilos.buscador}>

        <TextInput
          style={estilos.entrada}
          placeholder="Nombre del ninja"
          placeholderTextColor="#91A8C4"
          value={nombre}
          onChangeText={setNombre}
          onSubmitEditing={buscarPersonaje}
          autoCapitalize="words"
        />

        {/* Boton para buscar */}
        <TouchableOpacity
          style={estilos.botonBuscar}
          onPress={buscarPersonaje}
          disabled={cargando}
        >
          <FontAwesome
            name="search"
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>

      </View>

      {/* Aqui aparecen los mensajes de error */}
      {error !== "" && (
        <View style={estilos.errorContenedor}>
          <Text style={estilos.errorTexto}>
            {error}
          </Text>
        </View>
      )}

      {/* Indicador mientras se buscan los datos */}
      {cargando && (
        <ActivityIndicator
          size="large"
          color="#2878D0"
          style={{ marginVertical: 25 }}
        />
      )}

      {/* Aqui mostramos la informacion del ninja encontrado */}
      {personaje && !cargando && (

        <View style={estilos.tarjetaPrincipal}>

          {/* Nombre del ninja */}
          <Text style={estilos.nombrePersonaje}>
            {personaje.name}
          </Text>

          {/* Imagen principal del personaje */}
          <View style={estilos.imagenPrincipalContenedor}>

            {personaje.images[0] ? (

              <Image
                source={{ uri: personaje.images[0] }}
                style={estilos.imagenPrincipal}
                resizeMode="contain"
              />

            ) : (

              // Si no hay imagen, mostramos un icono
              <FontAwesome
                name="user"
                size={100}
                color="#91A8C4"
              />

            )}

          </View>

          {/* Aqui estan las tarjetas del clan y las tecnicas */}
          <View style={estilos.filaTarjetas}>

            {/* Tarjeta del clan */}
            {personaje.clan !== "" && (

              <View style={estilos.tarjetaInferior}>

                <Text style={estilos.tituloTarjeta}>
                  Clan
                </Text>

                <FontAwesome
                  name="users"
                  size={38}
                  color="#2878D0"
                />

                <Text style={estilos.textoTarjeta}>
                  {personaje.clan}
                </Text>

              </View>

            )}

            {/* Tarjeta con las tecnicas del personaje */}
            {personaje.jutsu.length > 0 && (

              <View style={estilos.tarjetaInferior}>

                <Text style={estilos.tituloTarjeta}>
                  Técnicas
                </Text>

                <FontAwesome
                  name="bolt"
                  size={38}
                  color="#2878D0"
                />

                {/* Scroll para poder ver todas las tecnicas */}
                <ScrollView
                  style={estilos.listaTecnicas}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >

                  {personaje.jutsu.map((tecnica, indice) => (

                    <Text
                      key={`${tecnica}-${indice}`}
                      style={estilos.textoTarjeta}
                    >
                      {traducirTecnica(tecnica)}
                    </Text>

                  ))}

                </ScrollView>

              </View>

            )}

          </View>

          {/* Mensaje cuando no tenemos clan ni tecnicas */}
          {personaje.clan === "" &&
            personaje.jutsu.length === 0 && (

              <Text style={estilos.sinDatos}>
                No hay información de clan ni técnicas
                para este personaje.
              </Text>

            )}

        </View>

      )}

      {/* Mensaje que aparece antes de buscar un ninja */}
      {!personaje && !cargando && error === "" && (

        <View style={estilos.mensajeInicial}>

          <FontAwesome
            name="search"
            size={45}
            color="#91A8C4"
          />

          <Text style={estilos.textoInicial}>
            Busca un ninja para conocer su clan y sus técnicas.
          </Text>

        </View>

      )}

    </ScrollView>
  );
}

// Aqui estan los estilos de la pantalla
// Se mantienen los mismos colores azules de la aplicacion
const estilos = StyleSheet.create({

  // Fondo de la pantalla
  fondo: {
    flex: 1,
    backgroundColor: "#EAF3FF",
  },

  // Espacios del contenido
  contenedor: {
    padding: 20,
    paddingBottom: 35,
  },

  // Encabezado
  encabezado: {
    alignItems: "center",
    marginBottom: 22,
  },

  // Titulo de la pantalla
  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2878D0",
    marginTop: 5,
    textAlign: "center",
  },

  // Texto debajo del titulo
  subtitulo: {
    fontSize: 14,
    color: "#7189A8",
    marginTop: 4,
  },

  // Caja del buscador
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

  // Donde escribimos el nombre
  entrada: {
    flex: 1,
    height: 45,
    paddingHorizontal: 12,
    color: "#263D59",
    fontSize: 15,
  },

  // Boton azul para buscar
  botonBuscar: {
    width: 45,
    height: 45,
    backgroundColor: "#2878D0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Caja de los errores
  errorContenedor: {
    backgroundColor: "#FFE8E8",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },

  // Texto del error
  errorTexto: {
    color: "#C62828",
    textAlign: "center",
  },

  // Tarjeta principal
  tarjetaPrincipal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: "#D2E5FA",
    elevation: 3,
  },

  // Nombre del personaje
  nombrePersonaje: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2878D0",
    textAlign: "center",
    marginBottom: 12,
  },

  // Espacio de la imagen
  imagenPrincipalContenedor: {
    width: "100%",
    height: 230,
    backgroundColor: "#F4F9FF",
    borderWidth: 3,
    borderColor: "#2998E8",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 12,
  },

  // Tamaño de la imagen
  imagenPrincipal: {
    width: "95%",
    height: "95%",
  },

  // Organiza las dos tarjetas inferiores
  filaTarjetas: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  // Estilo de las tarjetas del clan y las tecnicas
  tarjetaInferior: {
    flex: 1,
    minWidth: 0,
    height: 220,
    backgroundColor: "#F4F9FF",
    borderWidth: 2,
    borderColor: "#2998E8",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 10,
  },

  // Titulo de las tarjetas
  tituloTarjeta: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2878D0",
  },

  // Scroll de las tecnicas
  listaTecnicas: {
    width: "100%",
    flex: 1,
  },

  // Texto dentro de las tarjetas
  textoTarjeta: {
    color: "#425A78",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 3,
  },

  // Cuando no hay datos
  sinDatos: {
    color: "#7189A8",
    textAlign: "center",
    marginTop: 15,
  },

  // Mensaje antes de hacer una busqueda
  mensajeInicial: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },

  // Texto del mensaje inicial
  textoInicial: {
    color: "#7189A8",
    fontSize: 15,
    textAlign: "center",
    marginTop: 15,
  },

});
