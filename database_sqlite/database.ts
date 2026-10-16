import * as SQLite from "expo-sqlite";

// Abrimos la base de datos local del celular.
const db = SQLite.openDatabaseSync("pokeanime.db");

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

// Cambios que tenemos que enviar a Render.
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

// Creamos las tablas si todavía no existen.
export function iniciarBaseDeDatos() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS docentes (
      id INTEGER PRIMARY KEY,
      nombre TEXT,
      imagen TEXT,
      profesion TEXT,
      facultad TEXT,
      materias TEXT,
      correo TEXT,
      experiencia TEXT,
      resumen TEXT,
      perfil TEXT
    );

    CREATE TABLE IF NOT EXISTS pendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operacion TEXT NOT NULL,
      docente_id INTEGER,
      datos TEXT
    );

    CREATE TABLE IF NOT EXISTS docentes_nuevos (
      docente_id INTEGER PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT
    );
  `);

  console.log("Base de datos SQLite preparada correctamente");
}

// Guardamos un docente o actualizamos sus datos.
function guardarUnoLocal(docente: DocenteLocal) {
  db.runSync(
    `INSERT OR REPLACE INTO docentes
    (id, nombre, imagen, profesion, facultad, materias,
     correo, experiencia, resumen, perfil)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      docente.id,
      docente.nombre ?? "",
      docente.imagen ?? "",
      docente.profesion ?? "",
      docente.facultad ?? "",
      docente.materias ?? "",
      docente.correo ?? "",
      docente.experiencia ?? "",
      docente.resumen ?? "",
      docente.perfil ?? "",
    ]
  );
}

// Dejamos el correo en minúsculas y sin espacios.
export function normalizarCorreo(correo: string) {
  return (correo ?? "").trim().toLowerCase();
}

// Revisamos si ya hicimos la primera consulta a Render.
function primeraConsultaRealizada() {
  const resultado = db.getFirstSync<{ valor: string }>(
    "SELECT valor FROM configuracion WHERE clave = ?",
    ["primera_consulta_docentes"]
  );

  return resultado?.valor === "si";
}

// Guardamos los docentes que recibimos desde Render.
export function guardarDocentesLocal(docentes: DocenteLocal[]) {
  const pendientes = obtenerPendientes();

  // No tocamos docentes que todavía tienen cambios pendientes.
  const idsPendientes = new Set(
    pendientes.map((pendiente) => pendiente.docente_id)
  );

  const yaConsultamos = primeraConsultaRealizada();

  db.withTransactionSync(() => {
    for (const docente of docentes) {
      if (idsPendientes.has(docente.id)) {
        continue;
      }

      const existe = db.getFirstSync<{ id: number }>(
        "SELECT id FROM docentes WHERE id = ?",
        [docente.id]
      );

      // Después de la primera consulta, marcamos docentes nuevos.
      if (!existe && yaConsultamos) {
        db.runSync(
          "INSERT OR IGNORE INTO docentes_nuevos (docente_id) VALUES (?)",
          [docente.id]
        );
      }

      guardarUnoLocal(docente);
    }

    if (!yaConsultamos) {
      db.runSync(
        `INSERT OR REPLACE INTO configuracion (clave, valor)
         VALUES (?, ?)`,
        ["primera_consulta_docentes", "si"]
      );
    }
  });

  console.log("Docentes recibidos y guardados en SQLite");
}

// Consultamos los docentes guardados en el celular.
export function obtenerDocentesLocal(): DocenteLocal[] {
  return db.getAllSync<DocenteLocal>(
    "SELECT * FROM docentes ORDER BY id"
  );
}

// Consultamos cuáles docentes tienen la marca NUEVO.
export function obtenerIdsDocentesNuevos(): number[] {
  const resultados = db.getAllSync<{ docente_id: number }>(
    "SELECT docente_id FROM docentes_nuevos ORDER BY docente_id"
  );

  return resultados.map((item) => item.docente_id);
}

// Contamos cuántos docentes nuevos hemos detectado.
export function contarDocentesNuevos() {
  const resultado = db.getFirstSync<{ cantidad: number }>(
    "SELECT COUNT(*) AS cantidad FROM docentes_nuevos"
  );

  return resultado?.cantidad ?? 0;
}

// Consultamos los cambios que todavía no enviamos a Render.
export function obtenerPendientes(): OperacionPendiente[] {
  return db.getAllSync<OperacionPendiente>(
    "SELECT * FROM pendientes ORDER BY id"
  );
}

// REGISTRAR SIN INTERNET (POST).
export function registrarDocenteLocal(datos: DatosDocente) {
  // Creamos un ID negativo para distinguirlo de PostgreSQL.
  const idTemporal = -Date.now();

  const docente: DocenteLocal = {
    id: idTemporal,
    ...datos,
  };

  db.withTransactionSync(() => {
    guardarUnoLocal(docente);

    // Guardamos el POST para enviarlo cuando vuelva internet.
    db.runSync(
      `INSERT INTO pendientes (operacion, docente_id, datos)
       VALUES (?, ?, ?)`,
      ["POST", idTemporal, JSON.stringify(datos)]
    );
  });

  console.log("Docente registrado localmente. POST pendiente.");

  return docente;
}

// ACTUALIZAR SIN INTERNET (PUT).
export function actualizarDocenteLocal(
  id: number,
  datos: DatosDocente
) {
  const docente: DocenteLocal = {
    id,
    ...datos,
  };

  db.withTransactionSync(() => {
    guardarUnoLocal(docente);

    if (id < 0) {
      // Si todavía no existe en Render, actualizamos su POST.
      db.runSync(
        `UPDATE pendientes
         SET datos = ?
         WHERE docente_id = ? AND operacion = 'POST'`,
        [JSON.stringify(datos), id]
      );
    } else {
      // Si ya existe en Render, dejamos un PUT pendiente.
      db.runSync(
        `INSERT INTO pendientes (operacion, docente_id, datos)
         VALUES (?, ?, ?)`,
        ["PUT", id, JSON.stringify(datos)]
      );
    }
  });

  console.log("Docente actualizado en SQLite.");
}

// ELIMINAR SIN INTERNET (DELETE).
export function eliminarDocenteLocal(id: number) {
  db.withTransactionSync(() => {
    db.runSync(
      "DELETE FROM docentes WHERE id = ?",
      [id]
    );

    db.runSync(
      "DELETE FROM docentes_nuevos WHERE docente_id = ?",
      [id]
    );

    if (id < 0) {
      // Si nunca llegó a Render, cancelamos su POST.
      db.runSync(
        "DELETE FROM pendientes WHERE docente_id = ?",
        [id]
      );
    } else {
      // Ya no necesitamos enviar cambios de un docente eliminado.
      db.runSync(
        `DELETE FROM pendientes
         WHERE docente_id = ? AND operacion = 'PUT'`,
        [id]
      );

      const existe = db.getFirstSync<{ id: number }>(
        `SELECT id FROM pendientes
         WHERE docente_id = ? AND operacion = 'DELETE'`,
        [id]
      );

      if (!existe) {
        db.runSync(
          `INSERT INTO pendientes (operacion, docente_id, datos)
           VALUES (?, ?, ?)`,
          ["DELETE", id, null]
        );
      }
    }
  });

  console.log("Docente eliminado localmente.");
}

// Quitamos un cambio cuando Render ya lo recibió.
export function quitarPendiente(id: number) {
  db.runSync(
    "DELETE FROM pendientes WHERE id = ?",
    [id]
  );
}

// Cambiamos el ID temporal por el ID real de PostgreSQL.
export function actualizarIdTemporal(
  idTemporal: number,
  idReal: number
) {
  db.withTransactionSync(() => {
    // Si ya tenemos ese ID, no podemos reemplazarlo a ciegas.
    const existe = db.getFirstSync<{ id: number }>(
      "SELECT id FROM docentes WHERE id = ?",
      [idReal]
    );

    if (existe && idTemporal !== idReal) {
      throw new Error(
        "El ID real ya existe en SQLite. Hay que revisar el conflicto."
      );
    }

    db.runSync(
      "UPDATE docentes SET id = ? WHERE id = ?",
      [idReal, idTemporal]
    );

    db.runSync(
      "UPDATE pendientes SET docente_id = ? WHERE docente_id = ?",
      [idReal, idTemporal]
    );
  });

  console.log("ID temporal actualizado:", idTemporal, "->", idReal);
}

// Buscamos un docente local usando su correo.
export function buscarDocenteLocalPorCorreo(correo: string) {
  const correoNormalizado = normalizarCorreo(correo);

  return db.getFirstSync<DocenteLocal>(
    `SELECT * FROM docentes
     WHERE LOWER(TRIM(correo)) = ?
     LIMIT 1`,
    [correoNormalizado]
  );
}

// Buscamos los conflictos entre los POST pendientes y la nube.
// Esta función solamente detecta, no elimina información.
export function obtenerConflictosPendientes(
  docentesNube: DocenteLocal[]
): ConflictoDocente[] {
  const conflictos: ConflictoDocente[] = [];

  const docentesPorCorreo = new Map<string, DocenteLocal>();

  for (const docente of docentesNube) {
    const correo = normalizarCorreo(docente.correo);

    if (correo) {
      docentesPorCorreo.set(correo, docente);
    }
  }

  const pendientes = obtenerPendientes();

  for (const pendiente of pendientes) {
    if (pendiente.operacion !== "POST") {
      continue;
    }

    const local = db.getFirstSync<DocenteLocal>(
      "SELECT * FROM docentes WHERE id = ?",
      [pendiente.docente_id]
    );

    if (!local) {
      continue;
    }

    const nube = docentesPorCorreo.get(
      normalizarCorreo(local.correo)
    );

    if (nube) {
      conflictos.push({
        pendienteId: pendiente.id,
        local,
        nube,
      });
    }
  }

  return conflictos;
}

// Cuando el usuario acepta usar los datos de PostgreSQL,
// quitamos el registro temporal y su POST pendiente.
export function resolverConflictoDocente(
  pendienteId: number,
  docenteNube: DocenteLocal
) {
  db.withTransactionSync(() => {
    const pendiente = db.getFirstSync<OperacionPendiente>(
      "SELECT * FROM pendientes WHERE id = ? AND operacion = 'POST'",
      [pendienteId]
    );

    if (!pendiente) {
      return;
    }

    const local = db.getFirstSync<DocenteLocal>(
      "SELECT * FROM docentes WHERE id = ?",
      [pendiente.docente_id]
    );

    // Comprobamos nuevamente que los correos coincidan.
    if (
      !local ||
      !normalizarCorreo(local.correo) ||
      normalizarCorreo(local.correo) !==
        normalizarCorreo(docenteNube.correo)
    ) {
      throw new Error(
        "Los correos no coinciden. No se modificó el docente."
      );
    }

    // Cancelamos el POST que habría creado un duplicado.
    db.runSync(
      "DELETE FROM pendientes WHERE id = ?",
      [pendienteId]
    );

    // Eliminamos solamente el registro temporal.
    db.runSync(
      "DELETE FROM docentes WHERE id = ?",
      [pendiente.docente_id]
    );

    // Guardamos la versión de PostgreSQL.
    guardarUnoLocal(docenteNube);
  });

  console.log("Conflicto resuelto usando los datos de PostgreSQL.");
}

// Exportamos la conexión por si la necesitamos después.
export { db };
