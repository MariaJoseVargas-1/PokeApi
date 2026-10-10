import {
    actualizarIdTemporal,
    obtenerPendientes,
    quitarPendiente,
} from "./database";

// Microservicios de Render.
const POST_URL = "https://microservicio-docentes-post.onrender.com";
const PUT_URL = "https://microservicio-docentes-put.onrender.com";
const DELETE_URL = "https://microservicio-docentes-delete.onrender.com";

// Evitamos sincronizar dos veces al mismo tiempo.
let sincronizando = false;

// Enviamos a Render los cambios realizados sin internet.
export async function sincronizarPendientes() {
  if (sincronizando) return;

  sincronizando = true;

  try {
    const pendientes = obtenerPendientes();

    for (const pendiente of pendientes) {
      let url = "";

      if (pendiente.operacion === "POST") {
        url = `${POST_URL}/docentes`;
      } else if (pendiente.operacion === "PUT") {
        url = `${PUT_URL}/docentes/${pendiente.docente_id}`;
      } else {
        url = `${DELETE_URL}/docentes/${pendiente.docente_id}`;
      }

      // Enviamos la operación a su microservicio.
      const respuesta = await fetch(url, {
        method: pendiente.operacion,
        headers: {
          "Content-Type": "application/json",
        },
        ...(pendiente.operacion !== "DELETE" && pendiente.datos
          ? { body: pendiente.datos }
          : {}),
      });

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
      }

      // Quitamos el cambio pendiente después de sincronizarlo.
      quitarPendiente(pendiente.id);

      console.log("Sincronizado:", pendiente.operacion);
    }
  } catch (error) {
    // Si falla la conexión, conservamos los cambios pendientes.
    console.log("No se pudo sincronizar. Se intentará después.");
  } finally {
    sincronizando = false;
  }
}

