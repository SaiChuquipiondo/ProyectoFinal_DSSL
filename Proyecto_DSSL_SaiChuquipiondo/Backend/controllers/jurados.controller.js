const pool = require("../config/database");
const { notificar } = require("../utils/notificar");

// LISTAR PENDIENTES DEL JURADO
const listarPendientesJurado = async (req, res) => {
  try {
    if (req.user.rol !== "DOCENTE")
      return res.status(403).json({ message: "Acceso solo para docentes" });

    const id_jurado = req.user.id_docente;

    const [rows] = await pool.query(
      `
      SELECT p.id_proyecto, p.titulo, p.ruta_pdf, pj.rol_jurado
      FROM proyecto_jurado pj
      JOIN proyecto_tesis p ON p.id_proyecto = pj.id_proyecto
      WHERE pj.id_jurado = ?
        AND p.estado_proyecto = 'ASIGNADO_JURADOS'
        AND NOT EXISTS (
          SELECT 1 FROM revision_proyecto_jurado r
          WHERE r.id_proyecto = p.id_proyecto
            AND r.id_jurado = pj.id_jurado
        )
      `,
      [id_jurado]
    );

    res.json(rows);
  } catch (err) {
    console.error("ERROR listarPendientesJurado:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// REVISIÓN DEL JURADO
const revisionJurado = async (req, res) => {
  try {
    if (req.user.rol !== "DOCENTE")
      return res.status(403).json({ message: "Acceso solo para docentes" });

    const id_jurado = req.user.id_docente;
    const { id_proyecto } = req.params;
    const { estado_revision, comentarios } = req.body;

    await pool.query(
      `INSERT INTO revision_proyecto_jurado
       (id_proyecto, id_jurado, estado_revision, comentarios)
       VALUES (?, ?, ?, ?)`,
      [id_proyecto, id_jurado, estado_revision, comentarios]
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
          "Revisión de jurado",
          `Un jurado revisó tu proyecto "${titulo}". Estado: ${estado_revision}.`
        );
      }

      const [coord] = await pool.query(
        `SELECT id_usuario FROM usuario WHERE id_rol = 3`
      );

      for (const c of coord) {
        await notificar(
          c.id_usuario,
          "Revisión de jurado registrada",
          `Un jurado ha registrado revisión para el proyecto "${titulo}".`
        );
      }
    }

    res.json({ message: "Revisión del jurado registrada" });
  } catch (err) {
    console.error("ERROR revisionJurado:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// Etapa 2
// =========================================
// LISTAR BORRADORES PENDIENTES PARA EL JURADO
// =========================================
const borradoresPendientesJurado = async (req, res) => {
  try {
    const { rol, id_docente } = req.user;

    if (rol !== "DOCENTE")
      return res
        .status(403)
        .json({ message: "Acceso permitido solo a docentes" });

    const [rows] = await pool.query(
      `
      SELECT b.id_borrador, b.numero_iteracion, b.estado, b.ruta_pdf,
             p.titulo,
             CONCAT(per.nombres,' ',per.apellido_paterno,' ',per.apellido_materno) AS estudiante
      FROM tesis_borrador b
      JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
      JOIN proyecto_jurado pj ON pj.id_proyecto = p.id_proyecto
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona per ON per.id_persona = e.id_persona
      WHERE pj.id_jurado = ?
      ORDER BY b.fecha_subida DESC
      `,
      [id_docente]
    );

    res.json(rows);
  } catch (err) {
    console.error("ERROR borradoresPendientesJurado:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =========================================
// REVISAR BORRADOR (APROBAR / OBSERVAR)
// =========================================
const revisarBorradorJurado = async (req, res) => {
  try {
    const { rol, id_docente } = req.user;
    const { id_borrador } = req.params;
    const { estado_revision, comentarios } = req.body;

    if (rol !== "DOCENTE")
      return res.status(403).json({ message: "Acceso restringido a docentes" });

    if (!["APROBADO", "OBSERVADO"].includes(estado_revision)) {
      return res.status(400).json({
        message: "Estado inválido. Use APROBADO u OBSERVADO.",
      });
    }

    // Info del borrador
    const [info] = await pool.query(
      `
      SELECT b.id_proyecto, e.id_estudiante, p.titulo,
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

    // Validar que este docente es jurado del proyecto
    const [valJur] = await pool.query(
      `SELECT * FROM proyecto_jurado WHERE id_proyecto=? AND id_jurado=?`,
      [id_proyecto, id_docente]
    );

    if (valJur.length === 0)
      return res.status(403).json({ message: "No estás asignado como jurado" });

    // Registrar revisión
    await pool.query(
      `
      INSERT INTO revision_borrador_jurado
      (id_borrador, id_jurado, estado_revision, comentarios)
      VALUES (?, ?, ?, ?)
      `,
      [id_borrador, id_docente, estado_revision, comentarios || null]
    );

    // =========================
    // SI EL JURADO OBSERVA
    // =========================
    if (estado_revision === "OBSERVADO") {
      // Notificar estudiante
      const [usrEst] = await pool.query(
        `
        SELECT u.id_usuario
        FROM usuario u JOIN estudiante e ON e.id_persona=u.id_persona
        WHERE e.id_estudiante=?
        `,
        [id_estudiante]
      );

      await notificar(
        usrEst[0].id_usuario,
        "Observación de jurado",
        `Un jurado observó el borrador de la tesis "${titulo}".`
      );

      // Notificar asesor
      const [asesorUsr] = await pool.query(
        `
        SELECT u.id_usuario
        FROM proyecto_tesis p
        JOIN docente d ON d.id_docente = p.id_asesor
        JOIN usuario u ON u.id_persona = d.id_persona
        WHERE p.id_proyecto = ?
        `,
        [id_proyecto]
      );

      await notificar(
        asesorUsr[0].id_usuario,
        "Observación de jurado",
        `Un jurado observó el borrador de la tesis "${titulo}".`
      );

      // Actualizar estado del borrador
      await pool.query(
        `UPDATE tesis_borrador SET estado='OBSERVADO' WHERE id_borrador=?`,
        [id_borrador]
      );

      return res.json({ message: "Observación registrada correctamente" });
    }

    // =========================
    // SI EL JURADO APRUEBA
    // =========================
    if (estado_revision === "APROBADO") {
      // Revisar si TODOS los jurados ya aprobaron este borrador
      const [revisiones] = await pool.query(
        `
        SELECT estado_revision 
        FROM revision_borrador_jurado
        WHERE id_borrador = ?
        `,
        [id_borrador]
      );

      const aprobados = revisiones.filter(
        (r) => r.estado_revision === "APROBADO"
      ).length;

      // Cantidad total de jurados asignados
      const [totalJur] = await pool.query(
        `SELECT COUNT(*) AS total FROM proyecto_jurado WHERE id_proyecto=?`,
        [id_proyecto]
      );

      const total = totalJur[0].total;

      // SI NO TODOS APRUEBAN todavía
      if (aprobados < total) {
        return res.json({
          message: "Aprobado por este jurado. Esperando revisiones restantes.",
        });
      }

      // SI TODOS LOS JURADOS APRUEBAN → BORRADOR APROBADO
      await pool.query(
        `UPDATE tesis_borrador SET estado='APROBADO_JURADOS' WHERE id_borrador=?`,
        [id_borrador]
      );

      // Notificar estudiante
      const [usrEst] = await pool.query(
        `
        SELECT u.id_usuario
        FROM usuario u JOIN estudiante e ON e.id_persona=u.id_persona
        WHERE e.id_estudiante=?
        `,
        [id_estudiante]
      );

      await notificar(
        usrEst[0].id_usuario,
        "Borrador aprobado",
        `Todos los jurados aprobaron el borrador de la tesis "${titulo}".`
      );

      // Notificar coordinación
      const [coord] = await pool.query(
        `SELECT id_usuario FROM usuario WHERE id_rol = 3`
      );

      for (const c of coord) {
        await notificar(
          c.id_usuario,
          "Borrador aprobado por jurados",
          `El borrador de la tesis "${titulo}" ha sido aprobado por todos los jurados.`
        );
      }

      return res.json({ message: "Borrador aprobado por todos los jurados" });
    }
  } catch (err) {
    console.error("ERROR revisarBorradorJurado:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

module.exports = {
  listarPendientesJurado,
  revisionJurado,
  // Etapa 2
  revisarBorradorJurado,
  borradoresPendientesJurado,
};
