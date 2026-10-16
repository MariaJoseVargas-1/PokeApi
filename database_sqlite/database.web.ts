// Esta es la versión de la base de datos para Expo Web.
// En el navegador usamos Render directamente, sin SQLite.

// Datos que tiene cada docente.
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

// Los datos del formulario no incluyen el ID.
type DatosDocente = Omit<DocenteLocal, "id">;

// Cambios pendientes que usamos en Expo Go.
export type OperacionPendiente = {
  id: number;
  operacion: "POST" | "PUT" | "DELETE";
  docente_id: number;
  datos: string | null;
};

// Información de un conflicto entre SQLite y PostgreSQL.
export type ConflictoDocente = {
  pendienteId: number;
  local: DocenteLocal;
  nube: DocenteLocal;
};

// En Web no necesitamos abrir SQLite.
export function iniciarBaseDeDatos() {
  console.log("Expo Web: SQLite no se inicializa.");
}

// En Web los docentes se consultan directamente desde Render.
export function guardarDocentesLocal(docentes: DocenteLocal[]) {
  // No guardamos datos en SQLite desde el navegador.
}

// En Web no tenemos docentes guardados en SQLite.
export function obtenerDocentesLocal(): DocenteLocal[] {
  return [];
}

// En Web no tenemos cambios pendientes en SQLite.
export function obtenerPendientes(): OperacionPendiente[] {
  return [];
}

// Dejamos los correos en minúsculas y sin espacios.
// Así podemos compararlos igual que en Expo Go.
export function normalizarCorreo(correo: string) {
  return (correo ?? "").trim().toLowerCase();
}

// En Web no guardamos marcas de docentes nuevos en SQLite.
export function obtenerIdsDocentesNuevos(): number[] {
  return [];
}

// En Web no contamos novedades desde SQLite.
export function contarDocentesNuevos() {
  return 0;
}

// El registro sin conexión solo funciona en Expo Go.
export function registrarDocenteLocal(datos: DatosDocente): DocenteLocal {
  throw new Error("El registro sin conexión solo está disponible en Expo Go.");
}

// La edición sin conexión solo funciona en Expo Go.
export function actualizarDocenteLocal(id: number, datos: DatosDocente) {
  throw new Error("La edición sin conexión solo está disponible en Expo Go.");
}

// La eliminación sin conexión solo funciona en Expo Go.
export function eliminarDocenteLocal(id: number) {
  throw new Error("La eliminación sin conexión solo está disponible en Expo Go.");
}

// En Web no tenemos operaciones pendientes que quitar.
export function quitarPendiente(id: number) {
  // No hay pendientes SQLite en Web.
}

// En Web no usamos IDs temporales.
export function actualizarIdTemporal(idTemporal: number, idReal: number) {
  // No se utilizan IDs temporales en Web.
}

// En Web no buscamos docentes dentro de SQLite.
export function buscarDocenteLocalPorCorreo(
  correo: string
): DocenteLocal | null {
  return null;
}

// En Web no existen POST pendientes de SQLite.
// Por eso no necesitamos detectar conflictos locales.
export function obtenerConflictosPendientes(
  docentesNube: DocenteLocal[]
): ConflictoDocente[] {
  return [];
}

// En Web no hay conflictos de SQLite que resolver.
// Los registros se gestionan directamente en Render.
export function resolverConflictoDocente(
  pendienteId: number,
  docenteNube: DocenteLocal
) {
  // No hay cambios pendientes locales que eliminar.
}