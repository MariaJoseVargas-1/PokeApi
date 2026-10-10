import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Cada operación utiliza su propio microservicio en Render.
const GET_URL = "https://microservicio-docentes.onrender.com";
const POST_URL = "https://microservicio-docentes-post.onrender.com";
const PUT_URL = "https://microservicio-docentes-put.onrender.com";
const DELETE_URL = "https://microservicio-docentes-delete.onrender.com";

// Datos que tiene cada docente en PostgreSQL.
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

// Los campos del formulario son los mismos, pero sin el ID.
// PostgreSQL genera automáticamente el ID al registrar.
type Formulario = Omit<Docente, "id">;

const formularioVacio: Formulario = {
  nombre: "",
  imagen: "",
  profesion: "",
  facultad: "",
  materias: "",
  correo: "",
  experiencia: "",
  resumen: "",
  perfil: "",
};

type Campo = keyof Formulario;

const campos: { clave: Campo; titulo: string }[] = [
  { clave: "nombre", titulo: "Nombre completo" },
  { clave: "imagen", titulo: "URL de la imagen" },
  { clave: "profesion", titulo: "Profesión" },
  { clave: "facultad", titulo: "Facultad" },
  { clave: "materias", titulo: "Materias" },
  { clave: "correo", titulo: "Correo electrónico" },
  { clave: "experiencia", titulo: "Experiencia" },
  { clave: "resumen", titulo: "Resumen" },
  { clave: "perfil", titulo: "Perfil profesional" },
];

export default function AdministrarDocentes() {
  // Lista de docentes que obtenemos mediante GET.
  const [docentes, setDocentes] = useState<Docente[]>([]);

  // Información que escribimos en el formulario.
  const [formulario, setFormulario] = useState<Formulario>({
    ...formularioVacio,
  });

  // ID del docente que estamos editando.
  // Si es null, registraremos uno nuevo.
  const [idEditar, setIdEditar] = useState<number | null>(null);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [idEliminar, setIdEliminar] = useState<number | null>(null);

  // Cambia solamente el campo que estamos escribiendo.
  const cambiarCampo = (campo: Campo, valor: string) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  // GET: consultar todos los docentes.
  const consultarDocentes = async () => {
    setCargando(true);

    try {
      const respuesta = await fetch(`${GET_URL}/docentes`);

      if (!respuesta.ok) {
        throw new Error("No fue posible consultar los docentes.");
      }

      const datos = await respuesta.json();

      // Nuestro GET debe devolver una lista.
      if (!Array.isArray(datos)) {
        throw new Error("El microservicio no devolvió una lista.");
      }

      setDocentes(datos);
      setMensaje("");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "Error al conectar con el microservicio GET."
      );
    } finally {
      setCargando(false);
    }
  };

  // Consultamos los docentes al abrir la pantalla.
  useEffect(() => {
    consultarDocentes();
  }, []);

  // Limpiamos el formulario para registrar otro docente.
  const nuevoDocente = () => {
    setIdEditar(null);
    setFormulario({ ...formularioVacio });
    setIdEliminar(null);
    setMensaje("");
  };

  // Colocamos los datos del docente seleccionado en el formulario.
  const editarDocente = (docente: Docente) => {
    setIdEditar(docente.id);

    setFormulario({
      nombre: docente.nombre || "",
      imagen: docente.imagen || "",
      profesion: docente.profesion || "",
      facultad: docente.facultad || "",
      materias: docente.materias || "",
      correo: docente.correo || "",
      experiencia: docente.experiencia || "",
      resumen: docente.resumen || "",
      perfil: docente.perfil || "",
    });

    setMensaje(`Editando a ${docente.nombre}.`);
  };

  // POST: registrar un docente.
  // PUT: actualizar un docente existente.
  const guardarDocente = async () => {
    if (!formulario.nombre.trim()) {
      setMensaje("Debes escribir el nombre del docente.");
      return;
    }

    if (!formulario.correo.trim()) {
      setMensaje("Debes escribir el correo del docente.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    try {
      const editando = idEditar !== null;

      const url = editando
        ? `${PUT_URL}/docentes/${idEditar}`
        : `${POST_URL}/docentes`;

      const respuesta = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formulario),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo guardar el docente.");
      }

      nuevoDocente();

      // Actualizamos la lista después de guardar.
      await consultarDocentes();

      setMensaje(
        editando
          ? "Docente actualizado correctamente."
          : "Docente registrado correctamente."
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "Error al guardar el docente."
      );
    } finally {
      setGuardando(false);
    }
  };

  // DELETE: elimina un docente después de confirmar.
  const eliminarDocente = async (id: number) => {
    setGuardando(true);
    setMensaje("");

    try {
      const respuesta = await fetch(`${DELETE_URL}/docentes/${id}`, {
        method: "DELETE",
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo eliminar el docente.");
      }

      // Si estábamos editando ese docente, limpiamos el formulario.
      if (idEditar === id) {
        nuevoDocente();
      }

      setIdEliminar(null);
      await consultarDocentes();
      setMensaje("Docente eliminado correctamente.");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "Error al eliminar el docente."
      );
    } finally {
      setGuardando(false);
    }
  };

  // En Android/iOS mostramos una alerta de confirmación.
  // En Expo Web usamos una confirmación dentro de la pantalla.
  const confirmarEliminacion = (docente: Docente) => {
    if (Platform.OS === "web") {
      setIdEliminar(docente.id);
      return;
    }

    Alert.alert(
      "Eliminar docente",
      `¿Seguro que deseas eliminar a ${docente.nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => eliminarDocente(docente.id),
        },
      ]
    );
  };

  // Filtramos los docentes por nombre.
  const docentesFiltrados = docentes.filter((docente) =>
    docente.nombre.toLowerCase().includes(busqueda.toLowerCase().trim())
  );

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenedor}
        keyboardShouldPersistTaps="handled"
      >
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <TouchableOpacity
            style={styles.botonVolver}
            onPress={() => router.replace("/docentes")}
          >
            <FontAwesome name="arrow-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.textosEncabezado}>
            <Text style={styles.titulo}>Administrar docentes</Text>
            <Text style={styles.subtitulo}>
              UNINPAHU · Gestión de registros
            </Text>
          </View>
        </View>

        {/* Lista de docentes */}
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>
            <FontAwesome name="users" size={18} color="#2878D0" />
            {"  "}Docentes registrados
          </Text>

          <View style={styles.buscador}>
            <FontAwesome name="search" size={16} color="#2878D0" />
            <TextInput
              style={styles.entradaBusqueda}
              placeholder="Filtrar por nombre..."
              placeholderTextColor="#91A8C4"
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>

          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={consultarDocentes}
            disabled={cargando || guardando}
          >
            <FontAwesome name="refresh" size={15} color="#2878D0" />
            <Text style={styles.textoSecundario}>Actualizar lista</Text>
          </TouchableOpacity>

          {cargando ? (
            <ActivityIndicator
              size="large"
              color="#2878D0"
              style={styles.carga}
            />
          ) : docentesFiltrados.length === 0 ? (
            <Text style={styles.textoVacio}>
              No hay docentes para mostrar.
            </Text>
          ) : (
            docentesFiltrados.map((docente) => (
              <View key={docente.id} style={styles.filaDocente}>
                <View style={styles.informacionDocente}>
                  <Text style={styles.nombreDocente}>
                    {docente.nombre}
                  </Text>
                  <Text style={styles.detalleDocente}>
                    {docente.profesion}
                  </Text>
                  <Text style={styles.detalleDocente}>
                    ID: {docente.id}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.botonEditar}
                  onPress={() => editarDocente(docente)}
                  disabled={guardando}
                >
                  <FontAwesome
                    name="pencil"
                    size={16}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonEliminar}
                  onPress={() => confirmarEliminacion(docente)}
                  disabled={guardando}
                >
                  <FontAwesome
                    name="trash"
                    size={16}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Confirmación compatible con Expo Web */}
                {idEliminar === docente.id && (
                  <View style={styles.confirmacion}>
                    <Text style={styles.textoConfirmacion}>
                      ¿Eliminar definitivamente a {docente.nombre}?
                    </Text>

                    <View style={styles.filaBotones}>
                      <TouchableOpacity
                        style={styles.botonCancelar}
                        onPress={() => setIdEliminar(null)}
                      >
                        <Text style={styles.textoCancelar}>Cancelar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.botonConfirmar}
                        onPress={() => eliminarDocente(docente.id)}
                        disabled={guardando}
                      >
                        <Text style={styles.textoConfirmar}>
                          Sí, eliminar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Formulario para registrar o actualizar */}
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>
            <FontAwesome
              name={idEditar === null ? "plus-circle" : "pencil-square-o"}
              size={18}
              color="#2878D0"
            />
            {"  "}
            {idEditar === null
              ? "Registrar docente"
              : `Actualizar docente #${idEditar}`}
          </Text>

          <Text style={styles.descripcion}>
            {idEditar === null
              ? "Completa los datos del nuevo docente."
              : "Modifica los campos y guarda los cambios."}
          </Text>

          {campos.map((campo) => (
            <View key={campo.clave} style={styles.grupoCampo}>
              <Text style={styles.etiqueta}>{campo.titulo}</Text>

              <TextInput
                style={[
                  styles.entrada,
                  (campo.clave === "resumen" ||
                    campo.clave === "perfil") &&
                    styles.entradaGrande,
                ]}
                placeholder={`Escribe ${campo.titulo.toLowerCase()}`}
                placeholderTextColor="#91A8C4"
                value={formulario[campo.clave]}
                onChangeText={(valor) =>
                  cambiarCampo(campo.clave, valor)
                }
                multiline={
                  campo.clave === "resumen" ||
                  campo.clave === "perfil"
                }
                autoCapitalize={
                  campo.clave === "correo" ||
                  campo.clave === "imagen"
                    ? "none"
                    : "sentences"
                }
                keyboardType={
                  campo.clave === "correo"
                    ? "email-address"
                    : campo.clave === "imagen"
                    ? "url"
                    : "default"
                }
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={guardarDocente}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <FontAwesome
                  name={idEditar === null ? "save" : "check"}
                  size={17}
                  color="#FFFFFF"
                />
                <Text style={styles.textoPrincipal}>
                  {idEditar === null
                    ? "Registrar docente"
                    : "Guardar cambios"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {idEditar !== null && (
            <TouchableOpacity
              style={styles.botonSecundario}
              onPress={nuevoDocente}
              disabled={guardando}
            >
              <FontAwesome name="plus" size={15} color="#2878D0" />
              <Text style={styles.textoSecundario}>
                Cancelar edición / Nuevo docente
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mensajes de las operaciones */}
        {mensaje !== "" && (
          <View style={styles.cajaMensaje}>
            <FontAwesome
              name="info-circle"
              size={19}
              color="#2878D0"
            />
            <Text style={styles.mensaje}>{mensaje}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos azules de nuestra aplicación.
const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: "#EAF4FF",
  },
  contenedor: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 55 : 24,
    paddingBottom: 35,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  botonVolver: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#2878D0",
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
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#D2E5FA",
    marginBottom: 18,
    elevation: 2,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#174D8A",
    marginBottom: 12,
  },
  descripcion: {
    fontSize: 13,
    color: "#56789B",
    marginBottom: 16,
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D2E5FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F6FAFF",
    marginBottom: 12,
  },
  entradaBusqueda: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: "#234B73",
    fontSize: 14,
  },
  botonSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2878D0",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  textoSecundario: {
    color: "#2878D0",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 13,
  },
  carga: {
    marginVertical: 25,
  },
  textoVacio: {
    color: "#7896B8",
    textAlign: "center",
    marginVertical: 20,
  },
  filaDocente: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E2ECF8",
    paddingVertical: 13,
  },
  informacionDocente: {
    flex: 1,
    minWidth: 120,
  },
  nombreDocente: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#174D8A",
  },
  detalleDocente: {
    fontSize: 12,
    color: "#56789B",
    marginTop: 3,
  },
  botonEditar: {
    backgroundColor: "#2878D0",
    padding: 12,
    borderRadius: 10,
    marginLeft: 8,
  },
  botonEliminar: {
    backgroundColor: "#D9534F",
    padding: 12,
    borderRadius: 10,
    marginLeft: 8,
  },
  confirmacion: {
    width: "100%",
    backgroundColor: "#FFF4F4",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  textoConfirmacion: {
    color: "#9C3434",
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 10,
  },
  filaBotones: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  botonCancelar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
  },
  textoCancelar: {
    color: "#56789B",
    fontWeight: "bold",
  },
  botonConfirmar: {
    backgroundColor: "#D9534F",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
  },
  textoConfirmar: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  grupoCampo: {
    marginBottom: 14,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#174D8A",
    marginBottom: 7,
  },
  entrada: {
    borderWidth: 1,
    borderColor: "#D2E5FA",
    backgroundColor: "#F6FAFF",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: "#234B73",
  },
  entradaGrande: {
    minHeight: 85,
    textAlignVertical: "top",
  },
  botonPrincipal: {
    backgroundColor: "#2878D0",
    borderRadius: 13,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  textoPrincipal: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 10,
  },
  cajaMensaje: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D2E5FA",
    padding: 15,
    marginBottom: 15,
  },
  mensaje: {
    flex: 1,
    marginLeft: 10,
    color: "#56789B",
    fontSize: 13,
  },
});
