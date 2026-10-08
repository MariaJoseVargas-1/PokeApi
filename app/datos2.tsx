
import { FontAwesome } from "@expo/vector-icons";
import React from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useNaruto } from "../context/NarutoContext";

// Aqui traducimos algunos datos que pueden venir en ingles
const traducir = (texto: string): string => {
  const traducciones: Record<string, string> = {
    Male: "Masculino",
    Female: "Femenino",
    Alive: "Vivo",
    Deceased: "Fallecido",
    Unknown: "Desconocido",
    "Fire Release": "Liberación de fuego",
    "Wind Release": "Liberación de viento",
    "Lightning Release": "Liberación de rayo",
    "Earth Release": "Liberación de tierra",
    "Water Release": "Liberación de agua",
    "Wood Release": "Liberación de madera",
    "Yin Release": "Liberación Yin",
    "Yang Release": "Liberación Yang",
    "Yin–Yang Release": "Liberación Yin-Yang",
    "All Directions Shuriken": "Shuriken en todas las direcciones",
    "Baryon Mode": "Modo Barión",
    "Shadow Clone Technique": "Técnica de clones de sombra",
    "Summoning Technique": "Técnica de invocación",
    Ninja: "Ninja",
    "Academy Student": "Estudiante de la academia",
    Genin: "Genin",
    Chunin: "Chūnin",
    Jonin: "Jōnin",
    "Special Jonin": "Jōnin especial",
    Anbu: "ANBU",
    Kage: "Kage",

    // Algunas relaciones familiares
    father: "Padre",
    mother: "Madre",
    son: "Hijo",
    daughter: "Hija",
    brother: "Hermano",
    sister: "Hermana",
    wife: "Esposa",
    husband: "Esposo",
    spouse: "Pareja",
    grandfather: "Abuelo",
    grandmother: "Abuela",
    uncle: "Tío",
    aunt: "Tía",
    cousin: "Primo",
  };

  // Si no encontramos traduccion, dejamos el texto original
  return traducciones[texto] || texto;
};

// Esta funcion sirve para convertir los datos en texto
// Asi podemos mostrar listas, numeros y objetos en las tarjetas
const aTexto = (valor: any): string => {

  // Si no hay informacion, devolvemos un texto vacio
  if (valor === null || valor === undefined) {
    return "";
  }

  // Si ya es texto o numero, lo convertimos a string
  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    return String(valor);
  }

  // Si tenemos una lista, juntamos sus elementos
  if (Array.isArray(valor)) {
    return valor
      .map(aTexto)
      .filter(Boolean)
      .join(", ");
  }

  // Si es un objeto, mostramos sus datos
  if (typeof valor === "object") {
    return Object.entries(valor)
      .map(([clave, contenido]) => {
        const valorTexto = aTexto(contenido);

        if (!valorTexto) {
          return "";
        }

        return `${traducir(clave)}: ${valorTexto}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

// Aqui traducimos los elementos de una lista
const traducirLista = (lista: string[]): string[] => {
  return lista.map((elemento) => traducir(elemento));
};

// Esta funcion crea las tarjetas donde mostramos los datos
// Todas usan el mismo diseño para no repetir tanto codigo
function TarjetaInfo({
  titulo,
  icono,
  contenido,
}: {
  titulo: string;
  icono: React.ComponentProps<typeof FontAwesome>["name"];
  contenido: string[];
}) {

  // Quitamos los datos que esten vacios
  const datos = contenido.filter(
    (dato) => dato.trim() !== ""
  );

  // Si no hay informacion, no mostramos esa tarjeta
  if (datos.length === 0) {
    return null;
  }

  return (
    <View style={estilos.tarjeta}>

      {/* Titulo e icono de la tarjeta */}
      <View style={estilos.encabezadoTarjeta}>

        <FontAwesome
          name={icono}
          size={20}
          color="#2878D0"
        />

        <Text style={estilos.tituloTarjeta}>
          {titulo}
        </Text>

      </View>

      {/* Aqui mostramos los datos con scroll */}
      <ScrollView
        style={estilos.contenidoTarjeta}
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >

        {datos.map((dato, indice) => (

          <Text
            key={`${titulo}-${indice}`}
            style={estilos.textoDato}
          >
            {dato}
          </Text>

        ))}

      </ScrollView>

    </View>
  );
}

// Pantalla donde mostramos los datos del ninja
export default function Datos2() {

  // Tomamos el personaje que buscamos en API 2
  // Los datos ya vienen de MongoDB por medio de Railway
  const { personaje } = useNaruto();

  // Si no hemos buscado ningun ninja, mostramos este mensaje
  if (!personaje) {
    return (
      <View style={estilos.fondo}>

        <View style={estilos.mensajeInicial}>

          <FontAwesome
            name="search"
            size={50}
            color="#91A8C4"
          />

          <Text style={estilos.textoInicial}>
            Primero busca un ninja en la pestaña Naruto.
          </Text>

        </View>

      </View>
    );
  }

  // Aqui separamos la informacion del personaje
  // para usarla mas facilmente en las tarjetas
  const personal = personaje.personal || {};
  const familia = personaje.family || {};
  const debut = personaje.debut || {};

  // Aqui organizamos los datos personales
  const datosPersonales = [

    personal.sex
      ? `Sexo: ${traducir(aTexto(personal.sex))}`
      : "",

    personal.age
      ? `Edad: ${aTexto(personal.age)}`
      : "",

    personal.status
      ? `Estado: ${traducir(aTexto(personal.status))}`
      : "",

    personal.occupation
      ? `Ocupación: ${aTexto(personal.occupation)}`
      : "",

    personal.species
      ? `Especie: ${aTexto(personal.species)}`
      : "",

    personal.classification
      ? `Clasificación: ${aTexto(personal.classification)}`
      : "",

    personal.affiliation
      ? `Aldea: ${aTexto(personal.affiliation)}`
      : "",

    personal.birthdate
      ? `Cumpleaños: ${aTexto(personal.birthdate)}`
      : "",

    personal.organization
      ? `Organización: ${aTexto(personal.organization)}`
      : "",

    personal.height
      ? `Altura: ${aTexto(personal.height)}`
      : "",

    personal.weight
      ? `Peso: ${aTexto(personal.weight)}`
      : "",

  ].filter(Boolean);

  // Aqui organizamos los datos de la familia
  // MongoDB guarda las relaciones y los nombres
  const datosFamilia = Object.entries(familia)
    .map(([relacion, nombre]) => {

      const valor = aTexto(nombre);

      if (!valor) {
        return "";
      }

      return `${traducir(relacion)}: ${valor}`;
    })
    .filter(Boolean);

  // Rango que tiene el ninja
  const datosRango = personaje.rank
    ? [traducir(personaje.rank)]
    : [];

  // Tipos de chakra que puede utilizar
  const datosNaturaleza = traducirLista(
    personaje.natureType || []
  );

  // Tecnicas que tenemos guardadas en MongoDB
  const datosTecnicas = traducirLista(
    personaje.jutsu || []
  );

  // Habilidades especiales del personaje
  const datosHabilidades = [
    ...(personaje.uniqueTraits || []),
    ...(personaje.kekkeiGenkai || []),
  ].map(traducir);

  // Poder principal que guardamos en MongoDB
  // En API 2 lo dejamos dentro de description
  const datosPoder = personaje.description
    ? [personaje.description]
    : [];

  // Herramientas del ninja, si tenemos datos
  const datosHerramientas = traducirLista(
    personaje.tools || []
  );

  // Aldea u organizacion a la que pertenece
  const datosAfiliacion = personaje.affiliation || [];

  // Primera aparicion, si existe informacion
  const datosDebut = Object.entries(debut)
    .map(([medio, valor]) => {

      const texto = aTexto(valor);

      if (!texto) {
        return "";
      }

      return `${traducir(medio)}: ${texto}`;
    })
    .filter(Boolean);

  // Aqui empieza el diseño de la pantalla
  return (
    <ScrollView
      style={estilos.fondo}
      contentContainerStyle={estilos.contenedor}
      showsVerticalScrollIndicator
    >

      {/* Encabezado con la imagen y el nombre */}
      <View style={estilos.encabezado}>

        {personaje.images[0] ? (

          <Image
            source={{
              uri: personaje.images[0],
            }}
            style={estilos.imagenPersonaje}
            resizeMode="contain"
          />

        ) : (

          // Si no hay imagen, mostramos un icono
          <FontAwesome
            name="user"
            size={90}
            color="#91A8C4"
          />

        )}

        <Text style={estilos.nombre}>
          {personaje.name}
        </Text>

        {/* Mostramos el clan debajo del nombre */}
        {personaje.clan !== "" && (

          <Text style={estilos.subtitulo}>
            Clan: {personaje.clan}
          </Text>

        )}

      </View>

      {/* Aqui van todas las tarjetas del personaje */}
      <View style={estilos.listaTarjetas}>

        <TarjetaInfo
          titulo="Información personal"
          icono="user"
          contenido={datosPersonales}
        />

        <TarjetaInfo
          titulo="Familia"
          icono="users"
          contenido={datosFamilia}
        />

        <TarjetaInfo
          titulo="Rango ninja"
          icono="star"
          contenido={datosRango}
        />

        <TarjetaInfo
          titulo="Naturaleza del chakra"
          icono="bolt"
          contenido={datosNaturaleza}
        />

        <TarjetaInfo
          titulo="Poder principal"
          icono="fire"
          contenido={datosPoder}
        />

        <TarjetaInfo
          titulo="Técnicas"
          icono="magic"
          contenido={datosTecnicas}
        />

        <TarjetaInfo
          titulo="Habilidades especiales"
          icono="shield"
          contenido={datosHabilidades}
        />

        <TarjetaInfo
          titulo="Herramientas ninja"
          icono="wrench"
          contenido={datosHerramientas}
        />

        <TarjetaInfo
          titulo="Afiliaciones"
          icono="home"
          contenido={datosAfiliacion}
        />

        <TarjetaInfo
          titulo="Primera aparición"
          icono="book"
          contenido={datosDebut}
        />

      </View>

{/* esta parte sale hasta abajo pero de momento es mejor no mostrarla
  <Text style={estilos.pie}>
    Información proporcionada por nuestro microservicio de Naruto.
  </Text>
*/}

    </ScrollView>
  );
}

// Aqui estan los estilos de Datos 2
// Mantenemos los colores y las tarjetas del diseño original
const estilos = StyleSheet.create({

  // Fondo azul claro
  fondo: {
    flex: 1,
    backgroundColor: "#EAF3FF",
  },

  // Espacios generales de la pantalla
  contenedor: {
    padding: 18,
    paddingBottom: 35,
  },

  // Tarjeta de la imagen y el nombre
  encabezado: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#D2E5FA",
    padding: 18,
    marginBottom: 18,
  },

  // Imagen del ninja
  imagenPersonaje: {
    width: 170,
    height: 170,
    backgroundColor: "#F4F9FF",
    borderRadius: 14,
  },

  // Nombre del ninja
  nombre: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#2878D0",
    marginTop: 12,
    textAlign: "center",
  },

  // Clan que aparece debajo del nombre
  subtitulo: {
    fontSize: 14,
    color: "#7189A8",
    marginTop: 6,
    textAlign: "center",
  },

  // Espacio entre las tarjetas
  listaTarjetas: {
    gap: 14,
  },

  // Diseño de las tarjetas de informacion
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#D2E5FA",
    padding: 14,
  },

  // Donde aparece el icono y el titulo
  encabezadoTarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  // Titulo de cada tarjeta
  tituloTarjeta: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2878D0",
  },

  // Scroll dentro de las tarjetas
  contenidoTarjeta: {
    maxHeight: 150,
  },

  // Texto de la informacion
  textoDato: {
    color: "#425A78",
    fontSize: 14,
    lineHeight: 23,
    paddingVertical: 3,
  },

  // Mensaje cuando no hemos buscado un ninja
  mensajeInicial: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  // Texto del mensaje inicial
  textoInicial: {
    color: "#7189A8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 15,
  },

  // Texto pequeño al final
  pie: {
    color: "#7189A8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },

});
