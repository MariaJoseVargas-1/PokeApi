import {
  actualizarIdTemporal,
  obtenerConflictosPendientes,
  obtenerPendientes,
  quitarPendiente,
  type DocenteLocal,
} from "./database";

// Microservicios de Render.
const GET_URL = "https://microservicio-docentes.onrender.com";
const POST_URL = "https://microservicio-docentes-post.onrender.com";
const PUT_URL = "https://microservicio-docentes-put.onrender.com";
const DELETE_URL = "https://microservicio-docentes-delete.onrender.com";

// Evitamos sincronizar dos veces al mismo tiempo.
let sincronizando = false;

// Consultamos los docentes que existen en PostgreSQL.
async function consultarDocentesNube(): Promise<DocenteLocal[]> {
  const respuesta = await fetch(`${GET_URL}/docentes`);

  if (!respuesta.ok) {
    throw new Error("No se pudieron consultar los docentes de Render.");
  }

  const docentes = await respuesta.json();

  // Comprobamos que Render haya enviado una lista.
  if (!Array.isArray(docentes)) {
    throw new Error("Render no devolvió una lista válida.");
  }

  return docentes;
}

// Enviamos a Render los cambios realizados sin internet.
export async function sincronizarPendientes() {
  if (sincronizando) return;

  sincronizando = true;

  try {
    const pendientes = obtenerPendientes();

    // Si no tenemos cambios pendientes, no hacemos nada.
    if (pendientes.length === 0) {
      return;
    }

    // Consultamos primero la nube para detectar duplicados.
    let docentesNube = await consultarDocentesNube();

    for (const pendiente of pendientes) {
      // Antes de enviar un POST, revisamos si existe un conflicto.
      if (pendiente.operacion === "POST") {
        const conflictos = obtenerConflictosPendientes(docentesNube);

        const conflictoActual = conflictos.find(
          (conflicto) => conflicto.pendienteId === pendiente.id
        );

        if (conflictoActual) {
          // No borramos ni enviamos el docente hasta que el usuario decida.
          console.log(
            "Conflicto detectado. Pendiente de confirmación:",
            conflictoActual.local.correo
          );

          continue;
        }
      }

      let url = "";

      if (pendiente.operacion === "POST") {
        url = `${POST_URL}/docentes`;
      } else if (pendiente.operacion === "PUT") {
        url = `${PUT_URL}/docentes/${pendiente.docente_id}`;
      } else {
        url = `${DELETE_URL}/docentes/${pendiente.docente_id}`;
      }

      // Enviamos el cambio a su microservicio.
      const respuesta = await fetch(url, {
        method: pendiente.operacion,
        headers: {
          "Content-Type": "application/json",
        },
        ...(pendiente.operacion !== "DELETE" && pendiente.datos
          ? { body: pendiente.datos }
          : {}),
      });

      // El error 409 significa que ya existe un registro con ese correo.
      if (pendiente.operacion === "POST" && respuesta.status === 409) {
        console.log(
          "Render detectó un correo duplicado. Conservamos el POST pendiente."
        );

        // Actualizamos la lista por si el docente se registró
        // mientras estábamos realizando la sincronización.
        docentesNube = await consultarDocentesNube();

        continue;
      }

      // Si falla otro tipo de operación, conservamos el cambio.
      if (!respuesta.ok) {
        console.log("No se pudo sincronizar:", pendiente.id);
        break;
      }

      // Si registramos un docente, obtenemos su ID real.
      if (pendiente.operacion === "POST") {
        const resultado = await respuesta.json();

        const idReal = Number(resultado?.docente?.id);

        if (!Number.isSafeInteger(idReal) || idReal <= 0) {
          console.log("Render no devolvió un ID válido.");
          break;
        }

        // Reemplazamos el ID temporal por el de PostgreSQL.
        actualizarIdTemporal(pendiente.docente_id, idReal);

        // Actualizamos la lista de la nube para las siguientes comprobaciones.
        docentesNube.push(resultado.docente);
      }

      // Quitamos el cambio solo cuando Render lo recibió correctamente.
      quitarPendiente(pendiente.id);

      console.log("Sincronizado:", pendiente.operacion);
    }
  } catch (error) {
    // Si falla internet, conservamos los cambios pendientes.
    console.log("No se pudo sincronizar. Se intentará después.");
  } finally {
    sincronizando = false;
  }
}