
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

// Traducir algunos términos
const traducir = (texto: string): string => {
  const traducciones: { [key: string]: string } = {
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
  };

  return traducciones[texto] || texto;
};

// Convertir valores a texto
const aTexto = (valor: any): string => {
  if (valor === null || valor === undefined) return "";

  if (typeof valor === "string" || typeof valor === "number") {
    return String(valor);
  }

  if (Array.isArray(valor)) {
    return valor.map(aTexto).filter(Boolean).join(", ");
  }

  if (typeof valor === "object") {
    return Object.entries(valor)
      .map(([clave, contenido]) => {
        const valorTexto = aTexto(contenido);
        if (!valorTexto) return "";
        return `${traducir(clave)}: ${valorTexto}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

// Traducir listas
const traducirLista = (lista: string[]): string[] => {
  return lista.map((elemento) => traducir(elemento));
};

// Tarjeta con desplazamiento
function TarjetaInfo({
  titulo,
  icono,
  contenido,
}: {
  titulo: string;
  icono: React.ComponentProps<typeof FontAwesome>["name"];
  contenido: string[];
}) {
  const datos = contenido.filter((dato) => dato.trim() !== "");

  if (datos.length === 0) return null;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezadoTarjeta}>
        <FontAwesome name={icono} size={20} color="#2878D0" />
        <Text style={estilos.tituloTarjeta}>{titulo}</Text>
      </View>

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

export default function Datos2() {
  const { personaje } = useNaruto();

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
            Primero busca un personaje en la pestaña Naruto.
          </Text>
        </View>
      </View>
    );
  }

  const personal = personaje.personal || {};
  const familia = personaje.family || {};
  const debut = personaje.debut || {};

  const datosPersonales = [
    personal.sex ? `Sexo: ${traducir(aTexto(personal.sex))}` : "",
    personal.age ? `Edad: ${aTexto(personal.age)}` : "",
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
      ? `Afiliación: ${aTexto(personal.affiliation)}`
      : "",
    personal.birthdate
      ? `Fecha de nacimiento: ${aTexto(personal.birthdate)}`
      : "",
    personal.height ? `Altura: ${aTexto(personal.height)}` : "",
    personal.weight ? `Peso: ${aTexto(personal.weight)}` : "",
  ].filter(Boolean);

  const datosFamilia = Object.entries(familia)
    .map(([relacion, nombre]) => {
      const valor = aTexto(nombre);
      if (!valor) return "";
      return `${traducir(relacion)}: ${valor}`;
    })
    .filter(Boolean);

  const datosRango = personaje.rank
    ? [traducir(personaje.rank)]
    : [];

  const datosNaturaleza = traducirLista(personaje.natureType || []);
  const datosTecnicas = traducirLista(personaje.jutsu || []);

  const datosHabilidades = [
    ...(personaje.uniqueTraits || []),
    ...(personaje.kekkeiGenkai || []),
  ].map(traducir);

  const datosHerramientas = traducirLista(personaje.tools || []);
  const datosAfiliacion = personaje.affiliation || [];

  const datosDebut = Object.entries(debut)
    .map(([medio, valor]) => {
      const texto = aTexto(valor);
      if (!texto) return "";
      return `${traducir(medio)}: ${texto}`;
    })
    .filter(Boolean);

  return (
    <ScrollView
      style={estilos.fondo}
      contentContainerStyle={estilos.contenedor}
      showsVerticalScrollIndicator
    >
      <View style={estilos.encabezado}>
        {personaje.images[0] ? (
          <Image
            source={{ uri: personaje.images[0] }}
            style={estilos.imagenPersonaje}
            resizeMode="contain"
          />
        ) : (
          <FontAwesome
            name="user"
            size={90}
            color="#91A8C4"
          />
        )}

        <Text style={estilos.nombre}>{personaje.name}</Text>

        {personaje.clan !== "" && (
          <Text style={estilos.subtitulo}>
            Clan: {personaje.clan}
          </Text>
        )}
      </View>

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

      <Text style={estilos.pie}>
        Información proporcionada por la API de Naruto.
      </Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "#EAF3FF",
  },

  contenedor: {
    padding: 18,
    paddingBottom: 35,
  },

  encabezado: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#D2E5FA",
    padding: 18,
    marginBottom: 18,
  },

  imagenPersonaje: {
    width: 170,
    height: 170,
    backgroundColor: "#F4F9FF",
    borderRadius: 14,
  },

  nombre: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#2878D0",
    marginTop: 12,
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 14,
    color: "#7189A8",
    marginTop: 6,
    textAlign: "center",
  },

  listaTarjetas: {
    gap: 14,
  },

  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#D2E5FA",
    padding: 14,
  },

  encabezadoTarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  tituloTarjeta: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2878D0",
  },

  contenidoTarjeta: {
    maxHeight: 150,
  },

  textoDato: {
    color: "#425A78",
    fontSize: 14,
    lineHeight: 23,
    paddingVertical: 3,
  },

  mensajeInicial: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  textoInicial: {
    color: "#7189A8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 15,
  },

  pie: {
    color: "#7189A8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
});