const pool = require("../config/database");
const { notificar } = require("../utils/notificar");

// LISTAR PROYECTOS PENDIENTES DEL ASESOR
const listarPendientesAsesor = async (req, res) => {
  try {
    if (req.user.rol !== "DOCENTE")
      return res.status(403).json({ message: "Acceso solo para docentes" });

    const { id_docente } = req.user;

    const [proyectos] = await pool.query(
      `SELECT id_proyecto, titulo, resumen, ruta_pdf
       FROM proyecto_tesis
       WHERE id_asesor = ?
         AND estado_proyecto = 'REVISADO_FORMATO'`,
      [id_docente]
    );

    res.json(proyectos);
  } catch (err) {
    console.error("ERROR listarPendientesAsesor:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// REVISIÓN DEL ASESOR
const revisionAsesor = async (req, res) => {
  try {
    if (req.user.rol !== "DOCENTE")
      return res.status(403).json({ message: "Acceso solo para docentes" });

    const { id_docente } = req.user;
    const { id_proyecto } = req.params;
    const { estado_revision, comentarios } = req.body;

    await pool.query(
      `INSERT INTO revision_proyecto_asesor
       (id_proyecto, id_asesor, estado_revision, comentarios)
       VALUES (?, ?, ?, ?)`,
      [id_proyecto, id_docente, estado_revision, comentarios]
    );

    await pool.query(
      `UPDATE proyecto_tesis
       SET estado_proyecto = 'APROBADO_ASESOR'
       WHERE id_proyecto = ?`,
      [id_proyecto]
    );

    const [info] = await pool.query(
      `
      SELECT p.titulo,
             e.id_estudiante,
             per.nombres, per.apellido_paterno, per.apellido_materno
      FROM proyecto_tesis p
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona per ON per.id_persona = e.id_persona
      WHERE p.id_proyecto = ?`,
      [id_proyecto]
    );

    if (info.length > 0) {
      const titulo = info[0].titulo;
      const estudiante = `${info[0].nombres} ${info[0].apellido_paterno} ${info[0].apellido_materno}`;

      const [userEstu] = await pool.query(
        `SELECT u.id_usuario
         FROM usuario u
         JOIN estudiante e ON e.id_persona = u.id_persona
         WHERE e.id_estudiante = ?`,
        [info[0].id_estudiante]
      );

      if (userEstu.length > 0) {
        await notificar(
          userEstu[0].id_usuario,
          "Revisión de asesor",
          `Tu proyecto "${titulo}" fue revisado por tu asesor. Estado: ${estado_revision}. Comentarios: ${
            comentarios || "Sin comentarios."
          }`
        );
      }

      const [coord] = await pool.query(
        `SELECT id_usuario FROM usuario WHERE id_rol = 3`
      );

      for (const c of coord) {
        await notificar(
          c.id_usuario,
          "Revisión de asesor completada",
          `El proyecto "${titulo}" del estudiante ${estudiante} ya fue revisado por el asesor.`
        );
      }
    }

    res.json({ message: "Revisión del asesor registrada" });
  } catch (err) {
    console.error("ERROR revisionAsesor:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// Etapa 2
// =============================
// LISTAR BORRADORES PENDIENTES PARA EL ASESOR
// =============================
const borradoresPendientesAsesor = async (req, res) => {
  try {
    const { rol, id_docente } = req.user;

    if (rol !== "DOCENTE")
      return res.status(403).json({ message: "Acceso restringido a docentes" });

    const [rows] = await pool.query(
      `
      SELECT b.id_borrador, b.numero_iteracion, b.estado,
             b.ruta_pdf, p.titulo,
             CONCAT(per.nombres,' ',per.apellido_paterno,' ',per.apellido_materno) AS estudiante
      FROM tesis_borrador b
      JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona per ON per.id_persona = e.id_persona
      WHERE p.id_asesor = ? and b.estado = 'APROBADO_CORD'
      ORDER BY b.fecha_subida DESC
      `,
      [id_docente]
    );

    res.json(rows);
  } catch (err) {
    console.error("ERROR borradoresPendientesAsesor:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// REVISAR BORRADOR (APROBAR / OBSERVAR)
// =============================
const revisarBorradorAsesor = async (req, res) => {
  try {
    const { rol, id_docente } = req.user;
    if (rol !== "DOCENTE")
      return res.status(403).json({ message: "Acceso restringido a docentes" });

    const { id_borrador } = req.params;
    const { estado_revision, comentarios } = req.body;

    // Validar estado
    if (!["APROBADO", "OBSERVADO"].includes(estado_revision)) {
      return res.status(400).json({
        message: "Estado inválido. Use: APROBADO u OBSERVADO",
      });
    }

    // Obtener información del borrador y estudiante
    const [info] = await pool.query(
      `
      SELECT b.id_proyecto, e.id_estudiante,
             p.titulo,
             CONCAT(per.nombres,' ',per.apellido_paterno,' ',per.apellido_materno) AS estudiante
      FROM tesis_borrador b
      JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona per ON per.id_persona = e.id_persona
      WHERE b.id_borrador = ?
      `,
      [id_borrador]
    );

    if (info.length === 0)
      return res.status(404).json({ message: "Borrador no encontrado" });

    const { id_proyecto, id_estudiante, titulo, estudiante } = info[0];

    // Validar que este asesor es el asesor asignado del proyecto
    const [proy] = await pool.query(
      `SELECT id_asesor FROM proyecto_tesis WHERE id_proyecto = ?`,
      [id_proyecto]
    );

    if (proy[0].id_asesor !== id_docente)
      return res
        .status(403)
        .json({ message: "Este proyecto no pertenece al asesor" });

    // Registrar revisión del asesor
    await pool.query(
      `INSERT INTO revision_borrador_asesor
       (id_borrador, id_asesor, estado_revision, comentarios)
       VALUES (?, ?, ?, ?)`,
      [id_borrador, id_docente, estado_revision, comentarios || null]
    );

    // =============================
    // SI EL ASESOR OBSERVA EL BORRADOR
    // =============================
    if (estado_revision === "OBSERVADO") {
      // Notificar al estudiante
      const [userEstu] = await pool.query(
        `
        SELECT u.id_usuario
        FROM usuario u
        JOIN estudiante e ON e.id_persona = u.id_persona
        WHERE e.id_estudiante = ?
        `,
        [id_estudiante]
      );

      if (userEstu.length > 0) {
        await notificar(
          userEstu[0].id_usuario,
          "Observación del asesor",
          `Tu borrador del proyecto "${titulo}" fue observado por el asesor. Debes corregir y subir una nueva versión.`
        );
      }

      // Actualizar estado del borrador
      await pool.query(
        `UPDATE tesis_borrador SET estado='OBSERVADO' WHERE id_borrador=?`,
        [id_borrador]
      );

      return res.json({ message: "Observación registrada correctamente" });
    }

    // =============================
    // SI EL ASESOR APRUEBA EL BORRADOR
    // =============================
    if (estado_revision === "APROBADO") {
      // Actualizar estado
      await pool.query(
        `UPDATE tesis_borrador SET estado='APROBADO_ASESOR' WHERE id_borrador=?`,
        [id_borrador]
      );

      // Obtener jurados del proyecto
      const [jurados] = await pool.query(
        `
        SELECT u.id_usuario
        FROM proyecto_jurado pj
        JOIN docente d ON d.id_docente = pj.id_jurado
        JOIN usuario u ON u.id_persona = d.id_persona
        WHERE pj.id_proyecto = ?
        `,
        [id_proyecto]
      );

      // Notificar a jurados: deben revisar
      for (const j of jurados) {
        await notificar(
          j.id_usuario,
          "Borrador listo para revisión",
          `El borrador del proyecto "${titulo}" ha sido aprobado por el asesor. Debe proceder con la revisión.`
        );
      }

      return res.json({ message: "Borrador aprobado por el asesor" });
    }
  } catch (err) {
    console.error("ERROR revisarBorradorAsesor:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

module.exports = {
  listarPendientesAsesor,
  revisionAsesor,
  revisarBorradorAsesor,
  borradoresPendientesAsesor,
};
