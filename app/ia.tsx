import { FontAwesome } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import Markdown from "react-native-markdown-display";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

// Aquí está la dirección de nuestro microservicio.
// Ahora esat en Render
const API_IA = "https://microservicio-ia-p24z.onrender.com";

// Aquí están las tres inteligencias artificiales disponibles.
type Proveedor = "gemini" | "groq" | "nvidia";

// Aquí están los tiempos que puede seleccionar el usuario.
type TiempoEspera = 20 | 40 | 80 | 160;

// Aquí definimos cómo se guarda cada mensaje del chat.
type Mensaje = {
  id: number;
  tipo: "usuario" | "ia";
  texto: string;
};

// Aquí guardamos las opciones de inteligencia artificial.
const PROVEEDORES: Proveedor[] = [
  "gemini",
  "groq",
  "nvidia",
];

// Aquí guardamos los tiempos disponibles.
const TIEMPOS: TiempoEspera[] = [
  20,
  40,
  80,
  160,
];

// Aquí mostramos el nombre de cada inteligencia artificial.
function nombreProveedor(proveedor: Proveedor) {
  if (proveedor === "gemini") {
    return "Gemini";
  }

  if (proveedor === "groq") {
    return "Groq";
  }

  return "NVIDIA";
}

// Estas preguntas aparecen como sugerencias debajo del chat.
const PREGUNTAS_RAPIDAS = [
  {
    titulo: "Pikachu",
    pregunta: "¿Cuáles son las estadísticas de Pikachu?",
    icono: "bolt" as const,
  },
  {
    titulo: "Naruto",
    pregunta: "¿Qué técnicas tiene Naruto Uzumaki?",
    icono: "leaf" as const,
  },
  {
    titulo: "Eevee",
    pregunta: "¿Qué información tienes sobre Eevee?",
    icono: "paw" as const,
  },
  {
    titulo: "Kakashi",
    pregunta: "¿Qué sabes sobre Kakashi Hatake?",
    icono: "star" as const,
  },
];

// Aquí arreglamos algunos símbolos de las respuestas.
function prepararRespuesta(texto: string) {
  return texto
    .replace(/\\\*/g, "*")
    .replace(/\\_/g, "_")
    .replace(/\\n/g, "\n");
}

// Aquí comienza nuestra pantalla de inteligencia artificial.
export default function PantallaIA() {
  const { width } = useWindowDimensions();

  // Aquí revisamos si estamos en una pantalla grande.
  const esPantallaGrande = width >= 800;

  // Aquí guardamos lo que escribe el usuario.
  const [pregunta, setPregunta] = useState("");

  // Aquí sabemos si estamos esperando una respuesta.
  const [cargando, setCargando] = useState(false);

  // Aquí elegimos la IA que responderá.
  // Groq queda seleccionada al abrir la pantalla.
  const [proveedor, setProveedor] =
    useState<Proveedor>("groq");

  // Aquí elegimos cuánto tiempo puede esperar la respuesta.
  const [tiempo, setTiempo] =
    useState<TiempoEspera>(40);

  // Aquí controlamos si la configuración está abierta.
  const [mostrarConfiguracion, setMostrarConfiguracion] =
    useState(false);

  // Aquí guardamos nuestra conversación.
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: 1,
      tipo: "ia",
      texto:
        "¡Hola! 💙 Soy tu asistente de Pokémon y Anime.\n\n" +
        "Puedes preguntarme sobre nuestros **Pokémon y ninjas registrados**, " +
        "sus habilidades, historias, técnicas y curiosidades.\n\n" +
        "¡Estoy listo para ayudarte!",
    },
  ]);

  // Aquí guardamos la referencia del chat para bajar automáticamente.
  const scrollRef = useRef<ScrollView>(null);

  // Aquí damos un número diferente a cada mensaje.
  const siguienteId = useRef(2);

  // Aquí agregamos mensajes sin borrar los anteriores.
  function agregarMensaje(
    tipo: "usuario" | "ia",
    texto: string
  ) {
    setMensajes((anteriores) => [
      ...anteriores,
      {
        id: siguienteId.current++,
        tipo,
        texto,
      },
    ]);
  }

  // Aquí enviamos la pregunta con la IA y el tiempo elegidos.
  async function enviarPregunta(texto?: string) {
    const consulta = (texto ?? pregunta).trim();

    // Aquí evitamos enviar preguntas vacías o repetidas.
    if (!consulta || cargando) {
      return;
    }

    // Aquí comprobamos que la pregunta no sea demasiado larga.
    if (consulta.length > 500) {
      Alert.alert(
        "Pregunta muy larga",
        "Escribe una pregunta de máximo 500 caracteres."
      );
      return;
    }

    // Aquí guardamos las opciones usadas en esta pregunta.
    const proveedorElegido = proveedor;
    const tiempoElegido = tiempo;

    // Aquí mostramos la pregunta y activamos la animación.
    setPregunta("");
    agregarMensaje("usuario", consulta);
    setCargando(true);

    // Aquí controlamos el tiempo máximo de espera.
    const controlador = new AbortController();

    // Damos un pequeño margen para recibir el error del servidor.
    const temporizador = setTimeout(() => {
      controlador.abort();
    }, tiempoElegido * 1000 + 1500);

    try {
      // Aquí enviamos la pregunta a nuestro microservicio.
      const respuesta = await fetch(`${API_IA}/preguntar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pregunta: consulta,
          proveedor: proveedorElegido,
          tiempo: tiempoElegido,
        }),
        signal: controlador.signal,
      });

      // Aquí leemos la respuesta del microservicio.
      const datos = await respuesta.json();

      // Aquí mostramos el error si la consulta no funcionó.
      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo consultar el asistente."
        );
      }

      // Aquí agregamos la respuesta de la IA al chat.
      agregarMensaje(
        "ia",
        prepararRespuesta(
          datos.respuesta || "No encontré una respuesta."
        )
      );
    } catch (error) {
      // Aquí revisamos si se agotó el tiempo.
      const seAgotoTiempo =
        controlador.signal.aborted ||
        (error instanceof Error &&
          error.name === "AbortError");

      // Aquí preparamos el mensaje de error.
      const detalle = seAgotoTiempo
        ? `Se agotó el tiempo de espera de ${tiempoElegido} segundos.`
        : error instanceof Error
          ? error.message
          : "Error desconocido.";

      // Aquí mostramos el problema dentro de la conversación.
      agregarMensaje(
        "ia",
        "No pude obtener la respuesta.\n\n" +
          `**Detalle:** ${detalle}`
      );
    } finally {
      // Aquí detenemos el contador y quitamos la animación.
      clearTimeout(temporizador);
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.contenedor,
          esPantallaGrande && styles.contenedorGrande,
        ]}
      >
        {/* Aquí está el encabezado de nuestro asistente */}
        <View style={styles.encabezado}>
          <View style={styles.logo}>
            <FontAwesome
              name="comments"
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.informacion}>
            <Text
              style={styles.titulo}
              numberOfLines={1}
            >
              Asistente Pokémon & Anime
            </Text>

            <View style={styles.filaEstado}>
              <View style={styles.puntoVerde} />

              <Text style={styles.subtitulo}>
                Tu chat inteligente
              </Text>
            </View>
          </View>

          {/* Este botón abre y cierra la configuración */}
          <Pressable
            onPress={() =>
              setMostrarConfiguracion((anterior) => !anterior)
            }
            style={({ pressed }) => [
              styles.botonConfiguracion,
              mostrarConfiguracion &&
                styles.botonConfiguracionActivo,
              pressed && styles.botonPresionado,
            ]}
          >
            <FontAwesome
              name="sliders"
              size={19}
              color={
                mostrarConfiguracion
                  ? "#FFFFFF"
                  : "#2878D0"
              }
            />
          </Pressable>
        </View>

        {/* Aquí mostramos qué IA y tiempo están seleccionados */}
        <Pressable
          onPress={() =>
            setMostrarConfiguracion((anterior) => !anterior)
          }
          style={styles.barraConfiguracion}
        >
          <View style={styles.configuracionIzquierda}>
            <FontAwesome
              name="sliders"
              size={13}
              color="#6485A8"
            />

            <Text style={styles.textoConfiguracion}>
              CONFIGURACIÓN
            </Text>
          </View>

          <View style={styles.configuracionDerecha}>
            <Text style={styles.resumenConfiguracion}>
              {nombreProveedor(proveedor)}
              {"  ·  "}
              {tiempo} s
            </Text>

            <FontAwesome
              name={
                mostrarConfiguracion
                  ? "chevron-up"
                  : "chevron-down"
              }
              size={12}
              color="#6485A8"
            />
          </View>
        </Pressable>

        {/* Aquí mostramos las opciones cuando abrimos la configuración */}
        {mostrarConfiguracion && (
          <View style={styles.panelConfiguracion}>
            <Text style={styles.etiquetaOpciones}>
              Inteligencia artificial
            </Text>

            {/* Aquí aparecen Gemini, Groq y NVIDIA */}
            <View style={styles.filaOpciones}>
              {PROVEEDORES.map((opcion) => (
                <Pressable
                  key={opcion}
                  disabled={cargando}
                  onPress={() => setProveedor(opcion)}
                  style={[
                    styles.opcion,
                    proveedor === opcion &&
                      styles.opcionSeleccionada,
                    cargando && styles.opcionDesactivada,
                  ]}
                >
                  <Text
                    style={[
                      styles.textoOpcion,
                      proveedor === opcion &&
                        styles.textoOpcionSeleccionada,
                    ]}
                  >
                    {nombreProveedor(opcion)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.etiquetaOpciones}>
              Tiempo máximo de espera
            </Text>

            {/* Aquí aparecen los cuatro tiempos disponibles */}
            <View style={styles.filaOpciones}>
              {TIEMPOS.map((opcion) => (
                <Pressable
                  key={opcion}
                  disabled={cargando}
                  onPress={() => setTiempo(opcion)}
                  style={[
                    styles.opcion,
                    tiempo === opcion &&
                      styles.opcionSeleccionada,
                    cargando && styles.opcionDesactivada,
                  ]}
                >
                  <Text
                    style={[
                      styles.textoOpcion,
                      tiempo === opcion &&
                        styles.textoOpcionSeleccionada,
                    ]}
                  >
                    {opcion} s
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Aquí está el espacio principal de la conversación */}
        <View style={styles.contenedorChat}>
          <ScrollView
            ref={scrollRef}
            style={styles.chat}
            contentContainerStyle={styles.contenidoChat}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({
                animated: true,
              })
            }
          >
            {/* Aquí mostramos todos los mensajes */}
            {mensajes.map((mensaje) => (
              <View
                key={mensaje.id}
                style={[
                  styles.filaMensaje,
                  mensaje.tipo === "usuario"
                    ? styles.filaUsuario
                    : styles.filaIA,
                ]}
              >
                {/* Aquí mostramos el avatar de la IA */}
                {mensaje.tipo === "ia" && (
                  <View style={styles.avatarIA}>
                    <FontAwesome
                      name="comments"
                      size={16}
                      color="#2878D0"
                    />
                  </View>
                )}

                {/* Aquí mostramos la burbuja del mensaje */}
                <View
                  style={[
                    styles.burbuja,
                    mensaje.tipo === "usuario"
                      ? styles.burbujaUsuario
                      : styles.burbujaIA,
                  ]}
                >
                  {mensaje.tipo === "ia" ? (
                    <Markdown style={estilosMarkdown}>
                      {mensaje.texto}
                    </Markdown>
                  ) : (
                    <Text style={styles.textoUsuario}>
                      {mensaje.texto}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            {/* Aquí mostramos la animación mientras responde la IA */}
            {cargando && (
              <View
                style={[
                  styles.filaMensaje,
                  styles.filaIA,
                ]}
              >
                <View style={styles.avatarIA}>
                  <FontAwesome
                    name="comments"
                    size={16}
                    color="#2878D0"
                  />
                </View>

                <View style={styles.cajaCargando}>
                  <ActivityIndicator
                    size="small"
                    color="#2878D0"
                  />

                  <Text style={styles.textoCargando}>
                    Consultando {nombreProveedor(proveedor)}...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Aquí están las preguntas rápidas y el campo de escritura */}
        <View style={styles.seccionInferior}>
          <View style={styles.encabezadoSugerencias}>
            <FontAwesome
              name="lightbulb-o"
              size={14}
              color="#2878D0"
            />

            <Text style={styles.textoSugerencias}>
              Prueba una pregunta
            </Text>
          </View>

          {/* Aquí mostramos las preguntas rápidas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listaSugerencias}
          >
            {PREGUNTAS_RAPIDAS.map((item) => (
              <Pressable
                key={item.titulo}
                disabled={cargando}
                onPress={() => enviarPregunta(item.pregunta)}
                style={({ pressed }) => [
                  styles.botonSugerencia,
                  pressed && styles.botonPresionado,
                  cargando && styles.opcionDesactivada,
                ]}
              >
                <FontAwesome
                  name={item.icono}
                  size={13}
                  color="#2878D0"
                />

                <Text style={styles.textoSugerencia}>
                  {item.titulo}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Aquí escribimos nuestras preguntas */}
          <View style={styles.areaEscritura}>
            <TextInput
              style={styles.entrada}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor="#91A8C4"
              value={pregunta}
              onChangeText={setPregunta}
              multiline
              maxLength={500}
              editable={!cargando}
              textAlignVertical="top"
            />

            {/* Aquí enviamos la pregunta */}
            <Pressable
              onPress={() => enviarPregunta()}
              disabled={!pregunta.trim() || cargando}
              style={({ pressed }) => [
                styles.botonEnviar,
                (!pregunta.trim() || cargando) &&
                  styles.botonDesactivado,
                pressed && styles.botonPresionado,
              ]}
            >
              {cargando ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <FontAwesome
                  name="send"
                  size={17}
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          </View>

          <Text style={styles.aviso}>
            <FontAwesome
              name="shield"
              size={11}
              color="#91A8C4"
            />
            {"  "}Consulto personajes registrados en nuestra app
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Aquí damos formato a las respuestas de Gemini, Groq y NVIDIA.
const estilosMarkdown = {
  body: {
    color: "#31516F",
    fontSize: 15,
    lineHeight: 24,
  },

  paragraph: {
    marginTop: 0,
    marginBottom: 9,
  },

  strong: {
    color: "#173D68",
    fontWeight: "bold" as const,
  },

  em: {
    fontStyle: "italic" as const,
  },

  heading1: {
    color: "#173D68",
    fontSize: 20,
    fontWeight: "bold" as const,
    marginBottom: 10,
  },

  heading2: {
    color: "#173D68",
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 9,
  },

  heading3: {
    color: "#2878D0",
    fontSize: 16,
    fontWeight: "bold" as const,
    marginBottom: 7,
  },

  bullet_list: {
    marginBottom: 10,
  },

  ordered_list: {
    marginBottom: 10,
  },

  list_item: {
    marginBottom: 5,
  },

  bullet_list_icon: {
    color: "#2878D0",
    fontSize: 16,
  },

  ordered_list_icon: {
    color: "#2878D0",
    fontSize: 15,
  },

  blockquote: {
    backgroundColor: "#F2F7FD",
    borderLeftWidth: 3,
    borderLeftColor: "#2878D0",
    padding: 10,
    marginVertical: 8,
  },

  code_inline: {
    backgroundColor: "#E0EDFC",
    color: "#173D68",
    paddingHorizontal: 4,
    borderRadius: 4,
  },

  fence: {
    backgroundColor: "#F2F7FD",
    color: "#31516F",
    padding: 12,
    borderRadius: 8,
  },

  link: {
    color: "#2878D0",
    textDecorationLine: "underline" as const,
  },
};

// Aquí están todos los estilos de nuestra pantalla.
const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: "#F2F7FD",
  },

  contenedor: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
    minHeight: 0,
  },

  contenedorGrande: {
    maxWidth: 1050,
    alignSelf: "center",
    marginVertical: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DCE8F8",
  },

  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F9",
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#2878D0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  informacion: {
    flex: 1,
    minWidth: 0,
  },

  titulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#173D68",
  },

  filaEstado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },

  puntoVerde: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#32A66A",
  },

  subtitulo: {
    fontSize: 12,
    color: "#6485A8",
  },

  botonConfiguracion: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EDF5FE",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  botonConfiguracionActivo: {
    backgroundColor: "#2878D0",
  },

  botonPresionado: {
    opacity: 0.7,
  },

  barraConfiguracion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F9",
  },

  configuracionIzquierda: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  textoConfiguracion: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.8,
    color: "#6485A8",
  },

  configuracionDerecha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  resumenConfiguracion: {
    color: "#2878D0",
    fontSize: 12,
    fontWeight: "600",
  },

  panelConfiguracion: {
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE8F8",
  },

  etiquetaOpciones: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#173D68",
  },

  filaOpciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 5,
  },

  opcion: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D2E5FA",
    backgroundColor: "#FFFFFF",
  },

  opcionSeleccionada: {
    backgroundColor: "#2878D0",
    borderColor: "#2878D0",
  },

  textoOpcion: {
    color: "#28547F",
    fontSize: 12,
    fontWeight: "600",
  },

  textoOpcionSeleccionada: {
    color: "#FFFFFF",
  },

  opcionDesactivada: {
    opacity: 0.5,
  },

  // Aquí hacemos que el chat ocupe el espacio disponible.
  contenedorChat: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#F2F7FD",
  },

  chat: {
    flex: 1,
  },

  contenidoChat: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 20,
  },

  filaMensaje: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 18,
  },

  filaUsuario: {
    justifyContent: "flex-end",
  },

  filaIA: {
    justifyContent: "flex-start",
  },

  avatarIA: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0EDFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  burbuja: {
    maxWidth: "82%",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 17,
  },

  burbujaIA: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0EAF6",
    borderBottomLeftRadius: 5,
  },

  burbujaUsuario: {
    backgroundColor: "#2878D0",
    borderBottomRightRadius: 5,
  },

  textoUsuario: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 23,
  },

  cajaCargando: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0EAF6",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  textoCargando: {
    color: "#6485A8",
    fontSize: 13,
  },

  seccionInferior: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0EAF6",
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 11,
  },

  encabezadoSugerencias: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 9,
    paddingHorizontal: 3,
  },

  textoSugerencias: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6485A8",
  },

  listaSugerencias: {
    gap: 8,
    paddingBottom: 12,
  },

  botonSugerencia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#F2F7FD",
    borderWidth: 1,
    borderColor: "#DCE8F8",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },

  textoSugerencia: {
    fontSize: 12,
    color: "#28547F",
    fontWeight: "600",
  },

  areaEscritura: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F2F7FD",
    borderWidth: 1,
    borderColor: "#D2E5FA",
    borderRadius: 17,
    padding: 7,
  },

  entrada: {
    flex: 1,
    minHeight: 43,
    maxHeight: 110,
    paddingHorizontal: 11,
    paddingVertical: 10,
    color: "#173D68",
    fontSize: 14,
  },

  botonEnviar: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#2878D0",
    justifyContent: "center",
    alignItems: "center",
  },

  botonDesactivado: {
    backgroundColor: "#A8C5E4",
  },

  aviso: {
    fontSize: 10,
    color: "#91A8C4",
    textAlign: "center",
    marginTop: 9,
  },
});
