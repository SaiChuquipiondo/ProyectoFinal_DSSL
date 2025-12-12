const pool = require("../config/database");

// Estudiante solicita sustentación
const enviarSolicitud = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;
    const { id_tesis } = req.params;

    if (rol !== "ESTUDIANTE") {
      return res
        .status(403)
        .json({ message: "Solo estudiantes pueden solicitar sustentación" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Debe adjuntar el archivo PDF de solicitud" });
    }

    // Validar tesis pertenece al estudiante
    const [tesis] = await pool.query(
      "SELECT * FROM tesis WHERE id_tesis = ? AND id_estudiante = ?",
      [id_tesis, id_estudiante]
    );

    if (tesis.length === 0) {
      return res
        .status(404)
        .json({ message: "La tesis no pertenece al estudiante" });
    }

    // Validar versión aprobada
    const [aprobadas] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM revision_asesor ra
      INNER JOIN tesis_version tv ON tv.id_version = ra.id_version
      WHERE tv.id_tesis = ? AND ra.estado_revision = 'APROBADO'
      `,
      [id_tesis]
    );

    if (aprobadas[0].total === 0) {
      return res.status(400).json({
        message: "Debe tener al menos una versión aprobada por el asesor",
      });
    }

    // Insertar solicitud con archivo
    await pool.query(
      `
      INSERT INTO solicitud_sustentacion 
      (id_tesis, fecha_solicitud, estado_solicitud, ruta_pdf)
      VALUES (?, CURDATE(), 'PENDIENTE', ?)
      `,
      [id_tesis, req.file.filename]
    );

    res.json({
      message: "Solicitud enviada correctamente",
      archivo: req.file.filename,
    });
  } catch (error) {
    console.log("Error enviar solicitud:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const aprobarSolicitud = async (req, res) => {
  try {
    const { rol } = req.user;
    const { id_solicitud } = req.params;
    const { estado, observaciones } = req.body;

    if (rol !== "COORDINACION") {
      return res.status(403).json({ message: "Acceso restringido" });
    }

    if (!estado) {
      return res.status(400).json({ message: "Debe indicar estado" });
    }

    // Obtener solicitud y tesis asociada
    const [sol] = await pool.query(
      "SELECT * FROM solicitud_sustentacion WHERE id_solicitud = ?",
      [id_solicitud]
    );

    if (sol.length === 0) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    const id_tesis = sol[0].id_tesis;

    // Actualizar solicitud
    await pool.query(
      `
      UPDATE solicitud_sustentacion
      SET estado_solicitud = ?, observaciones = ?
      WHERE id_solicitud = ?
      `,
      [estado, observaciones || null, id_solicitud]
    );

    // Si fue aprobada, la tesis pasa a APTA_SUSTENTACION
    if (estado === "APROBADA") {
      await pool.query(
        "UPDATE tesis SET estado_tesis = 'APTA_SUSTENTACION' WHERE id_tesis = ?",
        [id_tesis]
      );

      // Registrar resolución
      await pool.query(
        `
        INSERT INTO resolucion (tipo, id_tesis, fecha, vigente)
        VALUES ('SOLICITUD', ?, CURDATE(), 1)
        `,
        [id_tesis]
      );
    }

    res.json({ message: "Solicitud procesada correctamente" });
  } catch (error) {
    console.log("Error aprobar solicitud:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

const programarSustentacion = async (req, res) => {
  try {
    const { rol } = req.user;
    const { id_tesis } = req.params;
    const { fecha, hora, aula, modalidad } = req.body;

    if (rol !== "COORDINACION") {
      return res.status(403).json({ message: "Acceso restringido" });
    }

    // Validar datos mínimos
    if (!fecha || !hora || !aula || !modalidad) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Validar estado de tesis
    const [tesis] = await pool.query(
      "SELECT id_asesor, estado_tesis FROM tesis WHERE id_tesis = ?",
      [id_tesis]
    );

    if (tesis.length === 0) {
      return res.status(404).json({ message: "Tesis no encontrada" });
    }

    if (tesis[0].estado_tesis !== "APTA_SUSTENTACION") {
      return res.status(400).json({
        message: "La tesis no está apta para programar sustentación",
      });
    }

    // Validar que tenga 3 jurados
    const [jurados] = await pool.query(
      "SELECT COUNT(*) AS total FROM jurado_tesis WHERE id_tesis = ?",
      [id_tesis]
    );

    if (jurados[0].total !== 3) {
      return res
        .status(400)
        .json({ message: "Debe tener 3 jurados asignados" });
    }

    // Registrar programación
    const [result] = await pool.query(
      `
      INSERT INTO sustentacion (id_tesis, fecha, hora, aula, modalidad, estado_sustentacion)
      VALUES (?, ?, ?, ?, ?, 'PROGRAMADA')
      `,
      [id_tesis, fecha, hora, aula, modalidad]
    );

    // Registrar resolución
    await pool.query(
      `
      INSERT INTO resolucion (tipo, id_tesis, fecha, vigente)
      VALUES ('PROGRAMACION', ?, CURDATE(), 1)
      `,
      [id_tesis]
    );

    // Actualizar estado de tesis
    await pool.query(
      "UPDATE tesis SET estado_tesis = 'PROGRAMADA' WHERE id_tesis = ?",
      [id_tesis]
    );

    res.json({
      message: "Sustentación programada correctamente",
      id_sustentacion: result.insertId,
    });
  } catch (error) {
    console.log("Error programar sustentación:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

const obtenerSustentacion = async (req, res) => {
  try {
    const { id_tesis } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM sustentacion WHERE id_tesis = ?",
      [id_tesis]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay sustentación programada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log("Error obtener sustentación:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

module.exports = {
  enviarSolicitud,
  aprobarSolicitud,
  programarSustentacion,
  obtenerSustentacion,
};
