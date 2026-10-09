import React, { useState } from "react";

import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { FontAwesome } from "@expo/vector-icons";

// URL publica de nuestro microservicio en Render
// Funciona en Expo Go y Expo Web sin utilizar una IP local
const API_URL = "https://microservicio-docentes.onrender.com";

// Aqui definimos los datos que recibimos de PostgreSQL
type Docente = {
  id: number;
  nombre: string;
  imagen: string;
  profesion: string;
  facultad: string;
  materias: string;
  correo: string;
  experiencia: string;
  resumen: string;
  perfil: string;
};

export default function Docentes() {
  // Guarda lo que escribimos en el buscador
  const [busqueda, setBusqueda] = useState("");

  // Guarda el docente encontrado
  const [docente, setDocente] = useState<Docente | null>(null);

  // Controla si mostramos el resumen o el perfil completo
  const [verMas, setVerMas] = useState(false);

  // Indica si estamos consultando el microservicio
  const [cargando, setCargando] = useState(false);

  // Guarda los mensajes para el usuario
  const [mensaje, setMensaje] = useState("");

  // Esta funcion busca un docente por su nombre
  const buscarDocente = async () => {
    const nombre = busqueda.trim();

    if (nombre === "") {
      setMensaje("Escribe el nombre de un docente.");
      setDocente(null);
      setVerMas(false);
      return;
    }

    setCargando(true);
    setMensaje("");
    setDocente(null);
    setVerMas(false);

    try {
      // Enviamos el nombre mediante query params
      const respuesta = await fetch(
        `${API_URL}/docentes/buscar?nombre=${encodeURIComponent(nombre)}`
      );

      if (!respuesta.ok) {
        throw new Error("Error al consultar el microservicio");
      }

      const datos: Docente[] = await respuesta.json();

      if (datos.length > 0) {
        // Mostramos el primer docente que coincida
        setDocente(datos[0]);
      } else {
        setMensaje("No encontramos un docente con ese nombre.");
      }
    } catch (error) {
      setMensaje("No se pudo conectar con el microservicio.");
    } finally {
      setCargando(false);
    }
  };

  // Esta funcion muestra el perfil completo
  const mostrarPerfil = () => {
    setVerMas(true);
  };

  // Esta funcion regresa al resumen
  const regresar = () => {
    setVerMas(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.contenedor}>

        {/* Encabezado de la pantalla */}
        <View style={styles.encabezado}>
          <View style={styles.iconoUniversidad}>
            <FontAwesome
              name="graduation-cap"
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.textosEncabezado}>
            <Text style={styles.titulo}>
              Docentes UNINPAHU
            </Text>

            <Text style={styles.subtitulo}>
              Directorio académico · Datos de ejemplo
            </Text>
          </View>
        </View>

        {/* Buscador: permanece fuera del scroll */}
        <View style={styles.buscador}>
          <FontAwesome
            name="search"
            size={18}
            color="#2878D0"
            style={styles.iconoBuscar}
          />

          <TextInput
            style={styles.entrada}
            placeholder="Buscar docente por nombre..."
            placeholderTextColor="#91A8C4"
            value={busqueda}
            onChangeText={setBusqueda}
            onSubmitEditing={buscarDocente}
            returnKeyType="search"
          />

          <TouchableOpacity
            style={styles.botonBuscar}
            onPress={buscarDocente}
            disabled={cargando}
          >
            <FontAwesome
              name="arrow-right"
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Mensaje inicial */}
        {!docente && !cargando && mensaje === "" && (
          <View style={styles.mensajeInicial}>
            <FontAwesome
              name="users"
              size={38}
              color="#91B9E5"
            />

            <Text style={styles.textoInicial}>
              Encuentra información sobre nuestros docentes
            </Text>

            <Text style={styles.textoEjemplo}>
              Prueba buscando Laura, Carlos o Ana
            </Text>
          </View>
        )}

        {/* Indicador de carga */}
        {cargando && (
          <View style={styles.cargando}>
            <ActivityIndicator
              size="large"
              color="#2878D0"
            />

            <Text style={styles.textoCargando}>
              Buscando docente...
            </Text>
          </View>
        )}

        {/* Mensajes de error */}
        {mensaje !== "" && !cargando && (
          <View style={styles.cajaMensaje}>
            <FontAwesome
              name="info-circle"
              size={20}
              color="#2878D0"
            />

            <Text style={styles.mensaje}>
              {mensaje}
            </Text>
          </View>
        )}

        {/* Tarjeta principal del docente */}
        {docente && !cargando && (
          <View style={styles.tarjeta}>

            {/* Encabezado fijo de la tarjeta */}
            <View style={styles.encabezadoTarjeta}>
              <Image
                source={{ uri: docente.imagen }}
                style={styles.imagen}
                resizeMode="cover"
              />

              <View style={styles.datosPrincipales}>
                <Text style={styles.nombre}>
                  {docente.nombre}
                </Text>

                <Text style={styles.profesion}>
                  {docente.profesion}
                </Text>

                <View style={styles.etiquetaUniversidad}>
                  <FontAwesome
                    name="graduation-cap"
                    size={12}
                    color="#2878D0"
                  />

                  <Text style={styles.textoUniversidad}>
                    UNINPAHU
                  </Text>
                </View>
              </View>
            </View>

            {/* Linea que separa el encabezado del contenido */}
            <View style={styles.separador} />

            {/* Titulo del contenido */}
            <View style={styles.filaSeccion}>
              <Text style={styles.tituloSeccion}>
                {verMas ? "Perfil académico" : "Sobre el docente"}
              </Text>

              <View style={styles.indicadorScroll}>
                <FontAwesome
                  name="arrows-v"
                  size={12}
                  color="#7896B8"
                />

                <Text style={styles.textoScroll}>
                  Desliza
                </Text>
              </View>
            </View>

            {/* SOLO ESTA PARTE TIENE SCROLL */}
            <View style={styles.areaInformacion}>
              <ScrollView
                style={styles.scrollInterno}
                contentContainerStyle={styles.contenidoScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* Vista del resumen */}
                {!verMas ? (
                  <View style={styles.bloqueInformacion}>
                    <Text style={styles.textoInformacion}>
                      {docente.resumen}
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Facultad */}
                    <View style={styles.bloqueInformacion}>
                      <View style={styles.filaEtiqueta}>
                        <FontAwesome
                          name="university"
                          size={16}
                          color="#2878D0"
                        />

                        <Text style={styles.etiqueta}>
                          Facultad
                        </Text>
                      </View>

                      <Text style={styles.textoInformacion}>
                        {docente.facultad}
                      </Text>
                    </View>

                    {/* Materias */}
                    <View style={styles.bloqueInformacion}>
                      <View style={styles.filaEtiqueta}>
                        <FontAwesome
                          name="book"
                          size={16}
                          color="#2878D0"
                        />

                        <Text style={styles.etiqueta}>
                          Materias que imparte
                        </Text>
                      </View>

                      <Text style={styles.textoInformacion}>
                        {docente.materias}
                      </Text>
                    </View>

                    {/* Experiencia */}
                    <View style={styles.bloqueInformacion}>
                      <View style={styles.filaEtiqueta}>
                        <FontAwesome
                          name="briefcase"
                          size={16}
                          color="#2878D0"
                        />

                        <Text style={styles.etiqueta}>
                          Experiencia profesional
                        </Text>
                      </View>

                      <Text style={styles.textoInformacion}>
                        {docente.experiencia}
                      </Text>
                    </View>

                    {/* Perfil profesional */}
                    <View style={styles.bloqueInformacion}>
                      <View style={styles.filaEtiqueta}>
                        <FontAwesome
                          name="user"
                          size={16}
                          color="#2878D0"
                        />

                        <Text style={styles.etiqueta}>
                          Perfil profesional
                        </Text>
                      </View>

                      <Text style={styles.textoInformacion}>
                        {docente.perfil}
                      </Text>
                    </View>

                    {/* Correo */}
                    <View style={styles.bloqueInformacion}>
                      <View style={styles.filaEtiqueta}>
                        <FontAwesome
                          name="envelope"
                          size={16}
                          color="#2878D0"
                        />

                        <Text style={styles.etiqueta}>
                          Correo de ejemplo
                        </Text>
                      </View>

                      <Text style={styles.textoInformacion}>
                        {docente.correo}
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>

            {/* Boton fijo debajo del scroll */}
            <TouchableOpacity
              style={styles.botonPrincipal}
              onPress={verMas ? regresar : mostrarPerfil}
            >
              <FontAwesome
                name={verMas ? "arrow-left" : "arrow-right"}
                size={16}
                color="#FFFFFF"
              />

              <Text style={styles.textoBoton}>
                {verMas
                  ? "Regresar al resumen"
                  : "Ver perfil completo"}
              </Text>
            </TouchableOpacity>

          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// Estilos de la pantalla
// Utilizamos los mismos tonos azules de nuestra aplicacion
const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: "#EAF4FF",
  },

  contenedor: {
    flex: 1,
  width: "100%",
  maxWidth: 650,
  alignSelf: "center",
  paddingHorizontal: 16,
  paddingTop: Platform.OS === "android" ? 55 : 24,
  paddingBottom: 18,
  },

  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  iconoUniversidad: {
    width: 50,
    height: 50,
    backgroundColor: "#2878D0",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  textosEncabezado: {
    flex: 1,
  },

  titulo: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#174D8A",
  },

  subtitulo: {
    fontSize: 12,
    color: "#56789B",
    marginTop: 4,
  },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D2E5FA",
    paddingLeft: 14,
    paddingRight: 6,
    height: 55,
    marginBottom: 20,
  },

  iconoBuscar: {
    marginRight: 10,
  },

  entrada: {
    flex: 1,
    fontSize: 14,
    color: "#234B73",
    height: "100%",
    minWidth: 0,
  },

  botonBuscar: {
    width: 42,
    height: 42,
    backgroundColor: "#2878D0",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  mensajeInicial: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D2E5FA",
    marginTop: 15,
  },

  textoInicial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#174D8A",
    textAlign: "center",
    marginTop: 15,
  },

  textoEjemplo: {
    fontSize: 13,
    color: "#7896B8",
    textAlign: "center",
    marginTop: 8,
  },

  cargando: {
    alignItems: "center",
    marginTop: 35,
  },

  textoCargando: {
    marginTop: 12,
    color: "#56789B",
    fontSize: 14,
  },

  cajaMensaje: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#D2E5FA",
  },

  mensaje: {
    color: "#56789B",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },

  tarjeta: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#D2E5FA",
    elevation: 3,
    overflow: "hidden",
  },

  encabezadoTarjeta: {
    flexDirection: "row",
    alignItems: "center",
  },

  imagen: {
    width: 86,
    height: 86,
    borderRadius: 16,
    backgroundColor: "#E1EEFC",
    marginRight: 15,
  },

  datosPrincipales: {
    flex: 1,
    justifyContent: "center",
  },

  nombre: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#174D8A",
    marginBottom: 5,
  },

  profesion: {
    fontSize: 14,
    color: "#56789B",
    marginBottom: 9,
  },

  etiquetaUniversidad: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EAF4FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  textoUniversidad: {
    color: "#2878D0",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },

  separador: {
    height: 1,
    backgroundColor: "#E2ECF8",
    marginVertical: 18,
  },

  filaSeccion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  tituloSeccion: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#174D8A",
  },

  indicadorScroll: {
    flexDirection: "row",
    alignItems: "center",
  },

  textoScroll: {
    color: "#7896B8",
    fontSize: 11,
    marginLeft: 6,
  },

  areaInformacion: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#F6FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2ECF8",
    overflow: "hidden",
  },

  scrollInterno: {
    flex: 1,
  },

  contenidoScroll: {
    padding: 14,
    paddingBottom: 20,
  },

  bloqueInformacion: {
    marginBottom: 15,
  },

  filaEtiqueta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  etiqueta: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2878D0",
    marginLeft: 10,
  },

  textoInformacion: {
    fontSize: 14,
    color: "#34495E",
    lineHeight: 22,
  },

  botonPrincipal: {
    backgroundColor: "#2878D0",
    borderRadius: 13,
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  textoBoton: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
