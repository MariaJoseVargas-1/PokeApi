import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

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

// Funciones para trabajar con SQLite en Expo Go.
import {
  actualizarDocenteLocal,
  eliminarDocenteLocal,
  guardarDocentesLocal,
  normalizarCorreo,
  obtenerConflictosPendientes,
  obtenerDocentesLocal,
  obtenerIdsDocentesNuevos,
  obtenerPendientes,
  registrarDocenteLocal,
  resolverConflictoDocente,
  type ConflictoDocente,
} from "../database_sqlite/database";

import { sincronizarPendientes } from "../database_sqlite/sincronizar";

// Cada operación tiene su microservicio en Render.
const GET_URL = "https://microservicio-docentes.onrender.com";
const POST_URL = "https://microservicio-docentes-post.onrender.com";
const PUT_URL = "https://microservicio-docentes-put.onrender.com";
const DELETE_URL = "https://microservicio-docentes-delete.onrender.com";

// Datos de cada docente.
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

// El formulario no necesita ID.
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
  const [docentes, setDocentes] = useState<Docente[]>([]);

  const [formulario, setFormulario] = useState<Formulario>({
    ...formularioVacio,
  });

  const [idEditar, setIdEditar] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [idEliminar, setIdEliminar] = useState<number | null>(null);

  // El usuario puede elegir cada cuánto consultar Render.
  const [intervalo, setIntervalo] = useState<2 | 10 | 30>(10);

  // Guardamos los IDs que tienen la marca NUEVO.
  const [idsNuevos, setIdsNuevos] = useState<number[]>([]);

  // Conflictos entre docentes offline y docentes de PostgreSQL.
  const [conflictos, setConflictos] = useState<ConflictoDocente[]>([]);

  // Evitamos que se acumulen consultas simultáneas.
  const consultandoRef = useRef(false);

  // Evitamos consultar mientras registramos o eliminamos.
  const guardandoRef = useRef(false);

  // Controlamos la primera consulta en Expo Web.
  const primeraConsultaWebRef = useRef(false);

  // IDs que ya conocemos en Expo Web.
  const idsConocidosWebRef = useRef<Set<number>>(new Set());

  // IDs nuevos detectados en Expo Web.
  const idsNuevosWebRef = useRef<Set<number>>(new Set());

  // Conflictos que el usuario decidió dejar pendientes por ahora.
  const conflictosOcultosRef = useRef<Set<number>>(new Set());

  // Nos ayuda a evitar actualizaciones después de salir de la pantalla.
  const pantallaActivaRef = useRef(true);

  // Actualizamos solamente el campo que escribe el usuario.
  const cambiarCampo = (campo: Campo, valor: string) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  // Mostramos los docentes locales sin incluir DELETE pendientes.
  const cargarDocentesLocales = () => {
    const locales = obtenerDocentesLocal() as Docente[];
    const pendientes = obtenerPendientes();

    const idsEliminados = new Set(
      pendientes
        .filter((item) => item.operacion === "DELETE")
        .map((item) => item.docente_id)
    );

    return locales.filter(
      (docente) => !idsEliminados.has(docente.id)
    );
  };

  // Consultamos Render y usamos SQLite si falla la conexión.
  // mostrarCarga es false durante las actualizaciones automáticas.
  const consultarDocentes = async (mostrarCarga = false) => {
    if (consultandoRef.current || guardandoRef.current) {
      return;
    }

    consultandoRef.current = true;

    if (mostrarCarga && pantallaActivaRef.current) {
      setCargando(true);
    }

    try {
      // Primero intentamos sincronizar los cambios offline.
      if (Platform.OS !== "web") {
        await sincronizarPendientes();
      }

      const respuesta = await fetch(`${GET_URL}/docentes`);

      if (!respuesta.ok) {
        throw new Error("No fue posible consultar los docentes.");
      }

      const datos: Docente[] = await respuesta.json();

      if (!Array.isArray(datos)) {
        throw new Error("El microservicio no devolvió una lista.");
      }

      if (!pantallaActivaRef.current) {
        return;
      }

      if (Platform.OS !== "web") {
        // Detectamos conflictos usando la lista completa de PostgreSQL.
        const conflictosEncontrados =
          obtenerConflictosPendientes(datos);

        // Dejamos visibles los conflictos que aún necesitan decisión.
        setConflictos(
          conflictosEncontrados.filter(
            (conflicto) =>
              !conflictosOcultosRef.current.has(
                conflicto.pendienteId
              )
          )
        );

        // Guardamos los docentes recibidos en SQLite.
        guardarDocentesLocal(datos);

        // Recuperamos los docentes locales y sus cambios pendientes.
        const locales = cargarDocentesLocales();

        // Si un correo está duplicado, mostramos la versión
        // de PostgreSQL, pero conservamos la local en SQLite.
        const correosNube = new Set(
          datos
            .map((docente) => normalizarCorreo(docente.correo))
            .filter((correo) => correo !== "")
        );

        const docentesVisibles = locales.filter((docente) => {
          if (docente.id >= 0) {
            return true;
          }

          // Ocultamos solamente la copia temporal duplicada.
          return !correosNube.has(
            normalizarCorreo(docente.correo)
          );
        });

        setDocentes(docentesVisibles);

        // Consultamos los docentes que SQLite marcó como nuevos.
        setIdsNuevos(obtenerIdsDocentesNuevos());
      } else {
        // En Web no hay SQLite. Recordamos los IDs en memoria.
        if (!primeraConsultaWebRef.current) {
          // La primera consulta es nuestra lista inicial.
          datos.forEach((docente) => {
            idsConocidosWebRef.current.add(docente.id);
          });

          primeraConsultaWebRef.current = true;
        } else {
          // Las siguientes consultas detectan registros nuevos.
          datos.forEach((docente) => {
            if (!idsConocidosWebRef.current.has(docente.id)) {
              idsNuevosWebRef.current.add(docente.id);
            }

            idsConocidosWebRef.current.add(docente.id);
          });
        }

        // Si un registro ya no existe, quitamos su marca.
        const idsActuales = new Set(
          datos.map((docente) => docente.id)
        );

        idsNuevosWebRef.current.forEach((id) => {
          if (!idsActuales.has(id)) {
            idsNuevosWebRef.current.delete(id);
          }
        });

        setIdsNuevos(Array.from(idsNuevosWebRef.current));
        setDocentes(datos);
        setConflictos([]);
      }

      // Limpiamos los mensajes de conexión anteriores.
      setMensaje((anterior) =>
        anterior.startsWith("Sin conexión.") ||
        anterior.startsWith("No fue posible conectar")
          ? ""
          : anterior
      );
    } catch (error) {
      if (!pantallaActivaRef.current) {
        return;
      }

      if (Platform.OS !== "web") {
        // Si no hay internet, seguimos mostrando SQLite.
        try {
          setDocentes(cargarDocentesLocales());
          setIdsNuevos(obtenerIdsDocentesNuevos());

          // Conservamos los conflictos ya detectados.
          setMensaje(
            "Sin conexión. Mostrando docentes guardados en SQLite."
          );
        } catch {
          setMensaje(
            "No fue posible consultar los docentes locales."
          );
        }
      } else {
        setMensaje(
          "No fue posible conectar con el microservicio GET."
        );
      }
    } finally {
      consultandoRef.current = false;

      if (pantallaActivaRef.current && mostrarCarga) {
        setCargando(false);
      }
    }
  };

  // Al abrir la pantalla consultamos los docentes.
  useEffect(() => {
    pantallaActivaRef.current = true;

    void consultarDocentes(true);

    return () => {
      pantallaActivaRef.current = false;
    };
  }, []);

  // Consultamos automáticamente cada 2, 10 o 30 segundos.
  useEffect(() => {
    const temporizador = setInterval(() => {
      if (
        !pantallaActivaRef.current ||
        guardandoRef.current ||
        consultandoRef.current
      ) {
        return;
      }

      // La consulta se hace sin mostrar el indicador de carga.
      void consultarDocentes(false);
    }, intervalo * 1000);

    return () => clearInterval(temporizador);
  }, [intervalo]);

  // Limpiamos el formulario.
  const nuevoDocente = () => {
    setIdEditar(null);
    setFormulario({ ...formularioVacio });
    setIdEliminar(null);
    setMensaje("");
  };

  // Cargamos los datos del docente para editarlo.
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

  // Registramos o actualizamos un docente.
  const guardarDocente = async () => {
    if (!formulario.nombre.trim()) {
      setMensaje("Debes escribir el nombre del docente.");
      return;
    }

    if (!formulario.correo.trim()) {
      setMensaje("Debes escribir el correo del docente.");
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);
    setMensaje("");

    const editando = idEditar !== null;

    try {
      // Si editamos un docente temporal, modificamos su POST local.
      if (
        Platform.OS !== "web" &&
        editando &&
        idEditar !== null &&
        idEditar < 0
      ) {
        actualizarDocenteLocal(idEditar, formulario);

        setDocentes((anteriores) =>
          anteriores.map((item) =>
            item.id === idEditar
              ? { id: idEditar, ...formulario }
              : item
          )
        );

        nuevoDocente();

        setMensaje(
          "Cambios guardados localmente. Pendientes de sincronizar."
        );

        return;
      }

      const url = editando
        ? `${PUT_URL}/docentes/${idEditar}`
        : `${POST_URL}/docentes`;

      let respuesta: Response;

      try {
        respuesta = await fetch(url, {
          method: editando ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formulario),
        });
      } catch {
        // El fetch falló. Guardamos el cambio en SQLite.
        if (Platform.OS === "web") {
          throw new Error("Sin conexión con Render.");
        }

        if (editando && idEditar !== null) {
          actualizarDocenteLocal(idEditar, formulario);

          setDocentes((anteriores) =>
            anteriores.map((item) =>
              item.id === idEditar
                ? { id: idEditar, ...formulario }
                : item
            )
          );

          setMensaje(
            "Docente actualizado en SQLite. Pendiente de sincronizar."
          );
        } else {
          const docenteLocal = registrarDocenteLocal(formulario);

          setDocentes((anteriores) => [
            docenteLocal,
            ...anteriores,
          ]);

          setMensaje(
            "Docente registrado en SQLite. Pendiente de sincronizar."
          );
        }

        setIdEditar(null);
        setFormulario({ ...formularioVacio });
        return;
      }

      // Si Render responde con error, lo mostramos.
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo guardar el docente."
        );
      }

      // En Web, el registro propio no debe contarse como
      // una inserción externa detectada por el temporizador.
      if (Platform.OS === "web" && !editando) {
        const idRegistrado = Number(datos?.docente?.id);

        if (Number.isSafeInteger(idRegistrado)) {
          idsConocidosWebRef.current.add(idRegistrado);
        }
      }

      setIdEditar(null);
      setFormulario({ ...formularioVacio });

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
      guardandoRef.current = false;
      setGuardando(false);

      // Actualizamos la lista al terminar.
      void consultarDocentes(false);
    }
  };

  // Eliminamos un docente de Render o SQLite.
  const eliminarDocente = async (id: number) => {
    guardandoRef.current = true;
    setGuardando(true);
    setMensaje("");

    try {
      // Los docentes con ID negativo todavía no están en Render.
      if (Platform.OS !== "web" && id < 0) {
        eliminarDocenteLocal(id);

        setDocentes((anteriores) =>
          anteriores.filter((item) => item.id !== id)
        );

        if (idEditar === id) {
          setIdEditar(null);
          setFormulario({ ...formularioVacio });
        }

        setIdEliminar(null);
        setMensaje("Docente local eliminado correctamente.");
        return;
      }

      let respuesta: Response;

      try {
        respuesta = await fetch(
          `${DELETE_URL}/docentes/${id}`,
          { method: "DELETE" }
        );
      } catch {
        // Si no hay conexión, eliminamos localmente.
        if (Platform.OS === "web") {
          throw new Error("Sin conexión con Render.");
        }

        eliminarDocenteLocal(id);

        setDocentes((anteriores) =>
          anteriores.filter((item) => item.id !== id)
        );

        if (idEditar === id) {
          setIdEditar(null);
          setFormulario({ ...formularioVacio });
        }

        setIdEliminar(null);

        setMensaje(
          "Docente eliminado en SQLite. Pendiente de sincronizar."
        );

        return;
      }

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo eliminar el docente."
        );
      }

      if (idEditar === id) {
        setIdEditar(null);
        setFormulario({ ...formularioVacio });
      }

      setIdEliminar(null);
      setMensaje("Docente eliminado correctamente.");
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "Error al eliminar el docente."
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);

      void consultarDocentes(false);
    }
  };

  // Confirmación de eliminación para celular y Web.
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

  // Resolvemos un conflicto cuando el usuario acepta la nube.
  const aceptarDatosNube = async (conflicto: ConflictoDocente) => {
    if (guardandoRef.current || consultandoRef.current) {
      setMensaje("Espera a que termine la consulta actual.");
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    try {
      // Confirmamos que el docente todavía existe en PostgreSQL.
      const respuesta = await fetch(`${GET_URL}/docentes`);

      if (!respuesta.ok) {
        throw new Error(
          "No se pudo verificar el docente en PostgreSQL."
        );
      }

      const docentesNube: Docente[] = await respuesta.json();

      if (!Array.isArray(docentesNube)) {
        throw new Error("La respuesta de Render no es válida.");
      }

      const docenteActual = docentesNube.find(
        (docente) =>
          normalizarCorreo(docente.correo) ===
          normalizarCorreo(conflicto.local.correo)
      );

      if (!docenteActual) {
        throw new Error(
          "El docente ya no aparece en PostgreSQL. Actualiza la lista."
        );
      }

      // SQLite elimina el POST temporal y guarda la versión nube.
      resolverConflictoDocente(
        conflicto.pendienteId,
        docenteActual
      );

      setConflictos((anteriores) =>
        anteriores.filter(
          (item) => item.pendienteId !== conflicto.pendienteId
        )
      );

      conflictosOcultosRef.current.delete(conflicto.pendienteId);

      setMensaje(
        `Conflicto resuelto: se conservaron los datos de PostgreSQL para ${docenteActual.nombre}.`
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No fue posible resolver el conflicto."
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);

      void consultarDocentes(false);
    }
  };

  // Dejamos el registro offline pendiente sin eliminarlo.
  const conservarConflicto = (conflicto: ConflictoDocente) => {
    conflictosOcultosRef.current.add(conflicto.pendienteId);

    setConflictos((anteriores) =>
      anteriores.filter(
        (item) => item.pendienteId !== conflicto.pendienteId
      )
    );

    setMensaje(
      `El registro offline de ${conflicto.local.nombre} sigue guardado en SQLite. No se enviará ni eliminará mientras exista el conflicto.`
    );
  };

  // Filtramos los docentes por nombre.
  const docentesFiltrados = docentes.filter((docente) =>
    docente.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase().trim())
  );

  const cantidadNuevos = idsNuevos.length;

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
            <FontAwesome
              name="arrow-left"
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.textosEncabezado}>
            <Text style={styles.titulo}>
              Administrar docentes
            </Text>

            <Text style={styles.subtitulo}>
              UNINPAHU · Gestión de registros
            </Text>
          </View>
        </View>

        {/* Configuración de actualización automática */}
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>
            <FontAwesome
              name="refresh"
              size={18}
              color="#2878D0"
            />
            {"  "}Sincronización automática
          </Text>

          <Text style={styles.descripcion}>
            Elige cada cuántos segundos consultar los docentes
            registrados en PostgreSQL.
          </Text>

          <View style={styles.opcionesIntervalo}>
            {([2, 10, 30] as const).map((segundos) => (
              <TouchableOpacity
                key={segundos}
                style={[
                  styles.botonIntervalo,
                  intervalo === segundos &&
                    styles.botonIntervaloActivo,
                ]}
                onPress={() => setIntervalo(segundos)}
              >
                <Text
                  style={[
                    styles.textoIntervalo,
                    intervalo === segundos &&
                      styles.textoIntervaloActivo,
                  ]}
                >
                  {segundos} s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.textoAyuda}>
            Actualización configurada: cada {intervalo} segundos.
          </Text>

          {/* Contador de docentes nuevos */}
          <View style={styles.contenedorNovedades}>
            <FontAwesome
              name="bell"
              size={18}
              color="#2878D0"
            />

            <Text style={styles.textoNovedades}>
              {cantidadNuevos === 0
                ? "No hay docentes nuevos detectados"
                : `${cantidadNuevos} ${
                    cantidadNuevos === 1
                      ? "docente nuevo"
                      : "docentes nuevos"
                  }`}
            </Text>
          </View>
        </View>

        {/* Avisos de conflictos pendientes */}
        {conflictos.length > 0 && (
          <View style={styles.tarjeta}>
            <Text style={styles.tituloSeccion}>
              <FontAwesome
                name="exclamation-triangle"
                size={18}
                color="#D48A19"
              />
              {"  "}Conflictos de sincronización
            </Text>

            <Text style={styles.descripcion}>
              Encontramos docentes creados sin internet cuyo correo
              ya existe en PostgreSQL. Revisa cada caso antes de
              descartar los datos locales.
            </Text>

            {conflictos.map((conflicto) => (
              <View
                key={conflicto.pendienteId}
                style={styles.tarjetaConflicto}
              >
                <Text style={styles.nombreConflicto}>
                  {conflicto.local.nombre}
                </Text>

                <Text style={styles.detalleDocente}>
                  Correo: {conflicto.local.correo}
                </Text>

                <Text style={styles.detalleDocente}>
                  Versión offline: {conflicto.local.profesion}
                </Text>

                <Text style={styles.detalleDocente}>
                  Versión PostgreSQL: {conflicto.nube.profesion}
                </Text>

                <Text style={styles.advertenciaConflicto}>
                  Si eliges PostgreSQL, se descartarán los cambios
                  de este registro temporal guardado offline.
                </Text>

                <TouchableOpacity
                  style={styles.botonResolver}
                  disabled={guardando}
                  onPress={() => aceptarDatosNube(conflicto)}
                >
                  <Text style={styles.textoBotonResolver}>
                    Usar datos de PostgreSQL
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonConservar}
                  disabled={guardando}
                  onPress={() => conservarConflicto(conflicto)}
                >
                  <Text style={styles.textoBotonConservar}>
                    Conservar pendiente
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Lista de docentes */}
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>
            <FontAwesome
              name="users"
              size={18}
              color="#2878D0"
            />
            {"  "}Docentes registrados
          </Text>

          <View style={styles.buscador}>
            <FontAwesome
              name="search"
              size={16}
              color="#2878D0"
            />

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
            onPress={() => consultarDocentes(true)}
            disabled={cargando || guardando}
          >
            <FontAwesome
              name="refresh"
              size={15}
              color="#2878D0"
            />

            <Text style={styles.textoSecundario}>
              Actualizar lista
            </Text>
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
              <View
                key={docente.id}
                style={styles.filaDocente}
              >
                <View style={styles.informacionDocente}>
                  <View style={styles.filaNombre}>
                    <Text style={styles.nombreDocente}>
                      {docente.nombre}
                    </Text>

                    {idsNuevos.includes(docente.id) && (
                      <View style={styles.etiquetaNuevo}>
                        <Text style={styles.textoNuevo}>
                          NUEVO
                        </Text>
                      </View>
                    )}
                  </View>

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
                        <Text style={styles.textoCancelar}>
                          Cancelar
                        </Text>
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
              name={
                idEditar === null
                  ? "plus-circle"
                  : "pencil-square-o"
              }
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
            <View
              key={campo.clave}
              style={styles.grupoCampo}
            >
              <Text style={styles.etiqueta}>
                {campo.titulo}
              </Text>

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
              <FontAwesome
                name="plus"
                size={15}
                color="#2878D0"
              />

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

            <Text style={styles.mensaje}>
              {mensaje}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos originales de la aplicación y los nuevos indicadores.
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

  // Botones para elegir el intervalo.
  opcionesIntervalo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  botonIntervalo: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2878D0",
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
  },

  botonIntervaloActivo: {
    backgroundColor: "#2878D0",
  },

  textoIntervalo: {
    color: "#2878D0",
    fontWeight: "bold",
    fontSize: 14,
  },

  textoIntervaloActivo: {
    color: "#FFFFFF",
  },

  textoAyuda: {
    color: "#56789B",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 15,
  },

  // Contador de registros nuevos.
  contenedorNovedades: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF4FF",
    padding: 13,
    borderRadius: 12,
  },

  textoNovedades: {
    color: "#174D8A",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
  },

  // Etiqueta NUEVO junto al nombre.
  filaNombre: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  etiquetaNuevo: {
    backgroundColor: "#DDF4E6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    marginLeft: 8,
    marginVertical: 3,
  },

  textoNuevo: {
    color: "#207B49",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Avisos de conflictos.
  tarjetaConflicto: {
    backgroundColor: "#FFF9EC",
    borderWidth: 1,
    borderColor: "#F1D8A3",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  nombreConflicto: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#174D8A",
    marginBottom: 6,
  },

  advertenciaConflicto: {
    color: "#93631A",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 12,
    lineHeight: 18,
  },

  botonResolver: {
    backgroundColor: "#2878D0",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },

  textoBotonResolver: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },

  botonConservar: {
    borderWidth: 1,
    borderColor: "#2878D0",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },

  textoBotonConservar: {
    color: "#2878D0",
    fontWeight: "bold",
    fontSize: 13,
  },
});