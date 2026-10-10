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

// Operaciones que después enviaremos a Render.
export type OperacionPendiente = {
  id: number;
  operacion: "POST" | "PUT" | "DELETE";
  docente_id: number;
  datos: string | null;
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
  `);

  console.log("Base de datos SQLite preparada correctamente");
}

// Guarda un docente o actualiza sus datos en SQLite.
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

// Guarda los docentes recibidos desde Render.
// No sobrescribimos docentes que tienen cambios pendientes.
export function guardarDocentesLocal(docentes: DocenteLocal[]) {
  const pendientes = obtenerPendientes();

  const idsPendientes = new Set(
    pendientes.map((pendiente) => pendiente.docente_id)
  );

  db.withTransactionSync(() => {
    for (const docente of docentes) {
      if (!idsPendientes.has(docente.id)) {
        guardarUnoLocal(docente);
      }
    }
  });

  console.log("Docentes recibidos y guardados en SQLite");
}

// Consulta los docentes almacenados en el celular.
export function obtenerDocentesLocal(): DocenteLocal[] {
  return db.getAllSync<DocenteLocal>(
    "SELECT * FROM docentes ORDER BY id"
  );
}

// Consulta las operaciones que falta enviar a la nube.
export function obtenerPendientes(): OperacionPendiente[] {
  return db.getAllSync<OperacionPendiente>(
    "SELECT * FROM pendientes ORDER BY id"
  );
}

// REGISTRAR SIN INTERNET (POST).
export function registrarDocenteLocal(datos: DatosDocente) {
  // Usamos un ID negativo temporal para no confundirlo
  // con los IDs positivos que genera PostgreSQL.
  const idTemporal = -Date.now();

  const docente: DocenteLocal = {
    id: idTemporal,
    ...datos,
  };

  db.withTransactionSync(() => {
    guardarUnoLocal(docente);

    // Recordamos que debemos hacer un POST en Render.
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

    // Si el docente es nuevo y todavía no se ha enviado,
    // actualizamos su POST pendiente en vez de crear un PUT.
    if (id < 0) {
      db.runSync(
        `UPDATE pendientes
         SET datos = ?
         WHERE docente_id = ? AND operacion = 'POST'`,
        [JSON.stringify(datos), id]
      );
    } else {
      // Si ya existe en PostgreSQL, guardamos un PUT pendiente.
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
    // Eliminamos el docente de la lista local.
    db.runSync(
      "DELETE FROM docentes WHERE id = ?",
      [id]
    );

    if (id < 0) {
      // Si todavía no se había registrado en Render,
      // cancelamos su POST pendiente.
      db.runSync(
        "DELETE FROM pendientes WHERE docente_id = ?",
        [id]
      );
    } else {
      // Quitamos los PUT pendientes del mismo docente.
      // Como lo eliminaremos, ya no hace falta actualizarlos.
      db.runSync(
        `DELETE FROM pendientes
         WHERE docente_id = ? AND operacion = 'PUT'`,
        [id]
      );

      // Evitamos guardar varios DELETE del mismo docente.
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

// Cuando una operación se envíe correctamente a Render,
// podremos quitarla de la lista de pendientes.
export function quitarPendiente(id: number) {
  db.runSync(
    "DELETE FROM pendientes WHERE id = ?",
    [id]
  );
}
// Reemplazamos el ID temporal por el ID que asigna PostgreSQL.
export function actualizarIdTemporal(
  idTemporal: number,
  idReal: number
) {
  db.withTransactionSync(() => {
    // Cambiamos el ID del docente guardado en SQLite.
    db.runSync(
      "UPDATE docentes SET id = ? WHERE id = ?",
      [idReal, idTemporal]
    );

    // Actualizamos las operaciones pendientes de ese docente.
    db.runSync(
      "UPDATE pendientes SET docente_id = ? WHERE docente_id = ?",
      [idReal, idTemporal]
    );
  });

  console.log("ID temporal actualizado:", idTemporal, "->", idReal);
}
// Exportamos la conexión para utilizarla después.
export { db };

