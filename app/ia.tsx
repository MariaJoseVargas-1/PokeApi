
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

// Nuestro microservicio de IA.
// Por ahora funciona en Expo Web desde el computador.
// Cuando lo despleguemos, pondremos aquí la URL pública.
const API_IA = "http://localhost:3001";

type Mensaje = {
  id: number;
  tipo: "usuario" | "ia";
  texto: string;
};

const PREGUNTAS_RAPIDAS = [
  {
    titulo: "Estadísticas de Pikachu",
    pregunta: "¿Cuáles son las estadísticas de Pikachu?",
    icono: "bolt" as const,
  },
  {
    titulo: "Técnicas de Naruto",
    pregunta: "¿Qué técnicas tiene Naruto Uzumaki?",
    icono: "leaf" as const,
  },
  {
    titulo: "Conoce a Eevee",
    pregunta: "¿Qué información tienes sobre Eevee?",
    icono: "paw" as const,
  },
  {
    titulo: "Conoce a Kakashi",
    pregunta: "¿Qué sabes sobre Kakashi Hatake?",
    icono: "star" as const,
  },
];

// Algunas respuestas pueden llegar con símbolos escapados.
// Los convertimos a Markdown normal para mostrarlos correctamente.
function prepararRespuesta(texto: string) {
  return texto
    .replace(/\\\*/g, "*")
    .replace(/\\_/g, "_")
    .replace(/\\n/g, "\n");
}

export default function PantallaIA() {
  const { width } = useWindowDimensions();
  const esPantallaGrande = width >= 800;

  const [pregunta, setPregunta] = useState("");
  const [cargando, setCargando] = useState(false);

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: 1,
      tipo: "ia",
      texto:
        "¡Hola! 💙 Soy tu asistente de IA.\n\n" +
        "Puedes preguntarme sobre nuestros **Pokémon y ninjas registrados**, " +
        "sus historias, habilidades, técnicas, apariciones y curiosidades.\n\n" +
        "¡Estoy listo para ayudarte!",
    },
  ]);

  const scrollRef = useRef<ScrollView>(null);
  const siguienteId = useRef(2);

  // Agregamos mensajes sin borrar los anteriores.
  function agregarMensaje(tipo: "usuario" | "ia", texto: string) {
    setMensajes((anteriores) => [
      ...anteriores,
      {
        id: siguienteId.current++,
        tipo,
        texto,
      },
    ]);
  }

  // Las preguntas rápidas y el botón usan esta misma función.
  async function enviarPregunta(texto?: string) {
    const consulta = (texto ?? pregunta).trim();

    if (!consulta || cargando) {
      return;
    }

    if (consulta.length > 500) {
      Alert.alert(
        "Pregunta muy larga",
        "Escribe una pregunta de máximo 500 caracteres."
      );
      return;
    }

    setPregunta("");
    agregarMensaje("usuario", consulta);
    setCargando(true);

    try {
      const respuesta = await fetch(`${API_IA}/preguntar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pregunta: consulta,
        }),
        signal: AbortSignal.timeout(110000),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo consultar el asistente."
        );
      }

      agregarMensaje(
        "ia",
        prepararRespuesta(
          datos.respuesta || "No encontré una respuesta."
        )
      );
    } catch (error) {
      const detalle =
        error instanceof Error
          ? error.message
          : "Error desconocido.";

      agregarMensaje(
        "ia",
        "No pude conectarme con el asistente.\n\n" +
        "Comprueba que nuestro microservicio esté funcionando.\n\n" +
        `**Detalle:** ${detalle}`
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.contenidoPrincipal,
          esPantallaGrande && styles.contenidoGrande,
        ]}
      >
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <View style={styles.iconoPrincipal}>
            <FontAwesome
              name="comments"
              size={25}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.textosEncabezado}>
            <Text style={styles.titulo}>
              Pregúntale a la IA
            </Text>

            <Text style={styles.subtitulo}>
              Sobre nuestros Pokémon y ninjas
            </Text>
          </View>

          <View style={styles.estado}>
            <View style={styles.puntoEstado} />
            <Text style={styles.textoEstado}>IA</Text>
          </View>
        </View>

        {/* Preguntas rápidas */}
        <View style={styles.seccionSugerencias}>
          <View style={styles.filaTituloSugerencias}>
            <FontAwesome
              name="lightbulb-o"
              size={17}
              color="#2878D0"
            />
            <Text style={styles.tituloSugerencias}>
              Preguntas rápidas
            </Text>
          </View>

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
                  cargando && styles.sugerenciaDesactivada,
                ]}
              >
                <FontAwesome
                  name={item.icono}
                  size={14}
                  color="#2878D0"
                />
                <Text style={styles.textoSugerencia}>
                  {item.titulo}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Chat principal */}
        <View style={styles.contenedorChat}>
          <View style={styles.barraChat}>
            <View style={styles.barraChatIzquierda}>
              <FontAwesome
                name="commenting-o"
                size={17}
                color="#2878D0"
              />
              <Text style={styles.tituloChat}>
                Tu conversación
              </Text>
            </View>

            <Text style={styles.contadorMensajes}>
              {mensajes.length} mensajes
            </Text>
          </View>

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
                {mensaje.tipo === "ia" && (
                  <View style={styles.avatarIA}>
                    <FontAwesome
                      name="comments"
                      size={17}
                      color="#2878D0"
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.burbuja,
                    mensaje.tipo === "usuario"
                      ? styles.burbujaUsuario
                      : styles.burbujaIA,
                    esPantallaGrande &&
                      styles.burbujaGrande,
                  ]}
                >
                  <Text
                    style={[
                      styles.nombreMensaje,
                      mensaje.tipo === "usuario"
                        ? styles.nombreUsuario
                        : styles.nombreIA,
                    ]}
                  >
                    {mensaje.tipo === "usuario"
                      ? "Tú"
                      : "Asistente IA"}
                  </Text>

                  {mensaje.tipo === "ia" ? (
                    // Aquí mostramos Markdown de verdad.
                    <Markdown style={estilosMarkdown}>
                      {mensaje.texto}
                    </Markdown>
                  ) : (
                    <Text
                      style={[
                        styles.textoMensaje,
                        styles.textoMensajeUsuario,
                      ]}
                    >
                      {mensaje.texto}
                    </Text>
                  )}
                </View>
              </View>
            ))}

            {/* Animación mientras Gemini responde */}
            {cargando && (
              <View style={styles.filaIA}>
                <View style={styles.avatarIA}>
                  <FontAwesome
                    name="comments"
                    size={17}
                    color="#2878D0"
                  />
                </View>

                <View style={styles.cajaCargando}>
                  <ActivityIndicator
                    size="small"
                    color="#2878D0"
                  />
                  <Text style={styles.textoCargando}>
                    Preparando tu respuesta...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Campo de escritura */}
        <View style={styles.pie}>
          <View style={styles.areaEscritura}>
            <TextInput
              style={styles.entrada}
              placeholder="Escribe tu pregunta aquí..."
              placeholderTextColor="#91A8C4"
              value={pregunta}
              onChangeText={setPregunta}
              multiline
              maxLength={500}
              editable={!cargando}
              textAlignVertical="top"
            />

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
                  size={19}
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          </View>

          <Text style={styles.aviso}>
            <FontAwesome
              name="shield"
              size={12}
              color="#91A8C4"
            />
            {"  "}Consulto personajes registrados en nuestra app
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Estilos especiales para las respuestas de Gemini.
const estilosMarkdown = {
  body: {
    color: "#31516F",
    fontSize: 15,
    lineHeight: 24,
  },

  paragraph: {
    marginTop: 0,
    marginBottom: 11,
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
    fontSize: 21,
    fontWeight: "bold" as const,
    marginBottom: 12,
  },

  heading2: {
    color: "#173D68",
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 10,
  },

  heading3: {
    color: "#2878D0",
    fontSize: 16,
    fontWeight: "bold" as const,
    marginBottom: 8,
  },

  bullet_list: {
    marginBottom: 12,
  },

  ordered_list: {
    marginBottom: 12,
  },

  list_item: {
    marginBottom: 7,
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
    padding: 12,
    marginVertical: 10,
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

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#F2F7FD",
  },

  contenidoPrincipal: {
    flex: 1,
    width: "100%",
  },

  contenidoGrande: {
    maxWidth: 1150,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },

  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#D2E5FA",
  },

  iconoPrincipal: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#2878D0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  textosEncabezado: {
    flex: 1,
  },

  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#173D68",
  },

  subtitulo: {
    fontSize: 13,
    color: "#6485A8",
    marginTop: 4,
  },

  estado: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E7F5ED",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },

  puntoEstado: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#32A66A",
  },

  textoEstado: {
    color: "#25835A",
    fontWeight: "bold",
    fontSize: 11,
  },

  seccionSugerencias: {
    backgroundColor: "#FFFFFF",
    paddingTop: 14,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#D2E5FA",
  },

  filaTituloSugerencias: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 12,
  },

  tituloSugerencias: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#173D68",
  },

  listaSugerencias: {
    paddingHorizontal: 18,
    gap: 10,
  },

  botonSugerencia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F2F7FD",
    borderWidth: 1,
    borderColor: "#D2E5FA",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  textoSugerencia: {
    fontSize: 12,
    color: "#28547F",
    fontWeight: "600",
  },

  botonPresionado: {
    opacity: 0.65,
  },

  sugerenciaDesactivada: {
    opacity: 0.5,
  },

  contenedorChat: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#F2F7FD",
  },

  barraChat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  barraChatIzquierda: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  tituloChat: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#173D68",
  },

  contadorMensajes: {
    fontSize: 12,
    color: "#91A8C4",
  },

  chat: {
    flex: 1,
  },

  contenidoChat: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },

  filaMensaje: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 20,
  },

  filaUsuario: {
    justifyContent: "flex-end",
  },

  filaIA: {
    justifyContent: "flex-start",
  },

  avatarIA: {
    width: 37,
    height: 37,
    borderRadius: 14,
    backgroundColor: "#DCEBFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  burbuja: {
    maxWidth: "86%",
    borderRadius: 19,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },

  burbujaGrande: {
    maxWidth: "78%",
  },

  burbujaIA: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D2E5FA",
    borderBottomLeftRadius: 5,
  },

  burbujaUsuario: {
    backgroundColor: "#2878D0",
    borderBottomRightRadius: 5,
  },

  nombreMensaje: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },

  nombreIA: {
    color: "#2878D0",
  },

  nombreUsuario: {
    color: "#DCEBFF",
  },

  textoMensaje: {
    color: "#31516F",
    fontSize: 15,
    lineHeight: 24,
  },

  textoMensajeUsuario: {
    color: "#FFFFFF",
  },

  cajaCargando: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#D2E5FA",
  },

  textoCargando: {
    fontSize: 13,
    color: "#6485A8",
  },

  pie: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#D2E5FA",
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 12,
  },

  areaEscritura: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F2F7FD",
    borderWidth: 1,
    borderColor: "#C8DEF6",
    borderRadius: 20,
    padding: 9,
  },

  entrada: {
    flex: 1,
    minHeight: 48,
    maxHeight: 130,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#173D68",
    fontSize: 15,
  },

  botonEnviar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#2878D0",
    alignItems: "center",
    justifyContent: "center",
  },

  botonDesactivado: {
    backgroundColor: "#A8C5E4",
  },

  aviso: {
    color: "#91A8C4",
    textAlign: "center",
    fontSize: 11,
    marginTop: 10,
  },
});
