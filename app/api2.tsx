
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

// Dirección del microservicio de Naruto para Expo Go
const API_URL = "http://10.148.18.133:3001";

// Traducir algunas técnicas
const traducirTecnica = (tecnica: string) => {
  const traducciones: { [key: string]: string } = {
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

  return traducciones[tecnica] || tecnica;
};

// Convertir un valor en una lista de textos
const convertirLista = (valor: any): string[] => {
  if (Array.isArray(valor)) {
    return valor
      .map((item) =>
        typeof item === "string" ? item : item?.name || ""
      )
      .filter(Boolean);
  }

  if (typeof valor === "string" && valor.trim() !== "") {
    return [valor];
  }

  return [];
};

// Obtener el clan
const obtenerClan = (personaje: any): string => {
  const clan = personaje.clan || personaje.personal?.clan;

  if (typeof clan === "string") {
    return clan;
  }

  if (Array.isArray(clan)) {
    return clan.join(", ");
  }

  return "";
};

export default function Api2() {
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const { personaje, setPersonaje } = useNaruto();

  const buscarPersonaje = async () => {
    if (nombre.trim() === "") {
      setError("Escribe el nombre de un personaje.");
      return;
    }

    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(
        `${API_URL}/personajes?nombre=${encodeURIComponent(
          nombre.trim()
        )}`
      );

      if (!respuesta.ok) {
        throw new Error("No se pudo consultar el microservicio.");
      }

      const datos = await respuesta.json();

      const lista = Array.isArray(datos)
        ? datos
        : datos.characters || datos.data || [];

      const encontrado =
        lista.find(
          (item: any) =>
            item.name
              ?.toLowerCase()
              .includes(nombre.trim().toLowerCase())
        ) || lista[0];

      if (!encontrado) {
        setPersonaje(null);
        setError("No se encontró el personaje.");
        return;
      }

      const nuevoPersonaje: PersonajeNaruto = {
        id: encontrado.id,
        name: encontrado.name || "Sin nombre",
        images: convertirLista(encontrado.images),
        clan: obtenerClan(encontrado),
        village:
          encontrado.village ||
          encontrado.personal?.affiliation ||
          "",
        jutsu: convertirLista(encontrado.jutsu),
        natureType: convertirLista(
          encontrado.natureType || encontrado.natureTypes
        ),
        rank:
          encontrado.rank?.ninjaRank?.["Part II"] ||
          encontrado.rank?.ninjaRank?.["Part I"] ||
          encontrado.rank?.ninja ||
          encontrado.rank?.["ninja rank"] ||
          "",
        description:
          encontrado.description ||
          encontrado.personal?.occupation ||
          "",
        affiliation: convertirLista(
          encontrado.affiliation ||
            encontrado.personal?.affiliation
        ),
        family: encontrado.family || {},
        personal: encontrado.personal || {},
        debut: encontrado.debut || {},
        tools: convertirLista(encontrado.tools),
        uniqueTraits: convertirLista(encontrado.uniqueTraits),
        kekkeiGenkai: convertirLista(
          encontrado.personal?.kekkeiGenkai ||
            encontrado.kekkeiGenkai
        ),
        classification:
          encontrado.personal?.classification || "",
      };

      setPersonaje(nuevoPersonaje);
    } catch (e) {
      console.error("Error al buscar personaje:", e);
      setError(
        "No se pudo conectar con el microservicio de Naruto."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView
      style={estilos.fondo}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      {/* Encabezado */}
      <View style={estilos.encabezado}>
        <FontAwesome name="leaf" size={42} color="#2878D0" />

        <Text style={estilos.titulo}>Mundo Ninja</Text>

        <Text style={estilos.subtitulo}>
          ¡Encuentra tu ninja favorito!
        </Text>
      </View>

      {/* Buscador */}
      <View style={estilos.buscador}>
        <TextInput
          style={estilos.entrada}
          placeholder="Nombre del personaje"
          placeholderTextColor="#91A8C4"
          value={nombre}
          onChangeText={setNombre}
          onSubmitEditing={buscarPersonaje}
          autoCapitalize="words"
        />

        <TouchableOpacity
          style={estilos.botonBuscar}
          onPress={buscarPersonaje}
          disabled={cargando}
        >
          <FontAwesome name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error !== "" && (
        <View style={estilos.errorContenedor}>
          <Text style={estilos.errorTexto}>{error}</Text>
        </View>
      )}

      {/* Cargando */}
      {cargando && (
        <ActivityIndicator
          size="large"
          color="#2878D0"
          style={{ marginVertical: 25 }}
        />
      )}

      {/* Resultado */}
      {personaje && !cargando && (
        <View style={estilos.tarjetaPrincipal}>
          <Text style={estilos.nombrePersonaje}>
            {personaje.name}
          </Text>

          {/* Imagen del personaje */}
          <View style={estilos.imagenPrincipalContenedor}>
            {personaje.images[0] ? (
              <Image
                source={{ uri: personaje.images[0] }}
                style={estilos.imagenPrincipal}
                resizeMode="contain"
              />
            ) : (
              <FontAwesome
                name="user"
                size={100}
                color="#91A8C4"
              />
            )}
          </View>

          {/* Clan y técnicas */}
          <View style={estilos.filaTarjetas}>
            {personaje.clan !== "" && (
              <View style={estilos.tarjetaInferior}>
                <Text style={estilos.tituloTarjeta}>Clan</Text>

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

            {personaje.jutsu.length > 0 && (
              <View style={estilos.tarjetaInferior}>
                <Text style={estilos.tituloTarjeta}>Técnicas</Text>

                <FontAwesome
                  name="bolt"
                  size={38}
                  color="#2878D0"
                />

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

          {personaje.clan === "" &&
            personaje.jutsu.length === 0 && (
              <Text style={estilos.sinDatos}>
                No hay información de clan ni técnicas para este personaje.
              </Text>
            )}
        </View>
      )}

      {/* Mensaje inicial */}
      {!personaje && !cargando && error === "" && (
        <View style={estilos.mensajeInicial}>
          <FontAwesome
            name="search"
            size={45}
            color="#91A8C4"
          />

          <Text style={estilos.textoInicial}>
            Busca un personaje para descubrir su clan y sus técnicas.
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

  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2878D0",
    marginTop: 5,
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
  },

  tarjetaPrincipal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: "#D2E5FA",
    elevation: 3,
  },

  nombrePersonaje: {
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
    borderRadius: 12,
    marginBottom: 12,
  },

  imagenPrincipal: {
    width: "95%",
    height: "95%",
  },

  filaTarjetas: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

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

  tituloTarjeta: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2878D0",
  },

  listaTecnicas: {
    width: "100%",
    flex: 1,
  },

  textoTarjeta: {
    color: "#425A78",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 3,
  },

  sinDatos: {
    color: "#7189A8",
    textAlign: "center",
    marginTop: 15,
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