// Versión para Expo Web.
// SQLite se utiliza en el celular, no en el navegador.

export type DocenteLocal = {
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

type DatosDocente = Omit<DocenteLocal, "id">;

export type OperacionPendiente = {
  id: number;
  operacion: "POST" | "PUT" | "DELETE";
  docente_id: number;
  datos: string | null;
};

export function iniciarBaseDeDatos() {
  console.log("Expo Web: SQLite no se inicializa.");
}

export function guardarDocentesLocal(docentes: DocenteLocal[]) {
  // En Web trabajamos directamente con Render.
}

export function obtenerDocentesLocal(): DocenteLocal[] {
  return [];
}

export function obtenerPendientes(): OperacionPendiente[] {
  return [];
}

export function registrarDocenteLocal(datos: DatosDocente): DocenteLocal {
  throw new Error("El registro sin conexión solo está disponible en Expo Go.");
}

export function actualizarDocenteLocal(id: number, datos: DatosDocente) {
  throw new Error("La edición sin conexión solo está disponible en Expo Go.");
}

export function eliminarDocenteLocal(id: number) {
  throw new Error("La eliminación sin conexión solo está disponible en Expo Go.");
}

export function quitarPendiente(id: number) {
  // No hay pendientes SQLite en Web.
}

export function actualizarIdTemporal(idTemporal: number, idReal: number) {
  // No se utilizan IDs temporales en Web.
}