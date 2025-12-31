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
      SELECT 
        p.id_proyecto, 
        p.titulo, 
        p.resumen,
        p.ruta_pdf, 
        p.iteracion,
        p.estado_proyecto,
        pj.rol_jurado,
        CONCAT(per.nombres, ' ', per.apellido_paterno, ' ', per.apellido_materno) AS nombre_estudiante,
        e.codigo_estudiante
      FROM proyecto_jurado pj
      JOIN proyecto_tesis p ON p.id_proyecto = pj.id_proyecto
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona per ON per.id_persona = e.id_persona
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

    // VERIFICAR SI LOS 3 JURADOS YA REVISARON
    const [reviews] = await pool.query(
      `SELECT estado_revision 
       FROM revision_proyecto_jurado 
       WHERE id_proyecto = ?`,
      [id_proyecto]
    );

    // Si ya hay 3 revisiones (los 3 jurados revisaron)
    console.log(
      `[JURADOS] Proyecto ${id_proyecto}: ${reviews.length} revisiones encontradas`
    );

    if (reviews.length === 3) {
      const aprobados = reviews.filter(
        (r) => r.estado_revision === "APROBADO"
      ).length;
      const observados = reviews.filter(
        (r) => r.estado_revision === "OBSERVADO"
      ).length;

      console.log(
        `[JURADOS] Aprobados: ${aprobados}, Observados: ${observados}`
      );

      let nuevoEstado = "";
      let mensajeEstudiante = "";

      if (observados >= 2) {
        // 2 O MÁS JURADOS RECHAZARON
        nuevoEstado = "OBSERVADO_JURADOS";
        mensajeEstudiante = `Tu proyecto "${info[0]?.titulo}" fue observado por la mayoría de jurados. Revisa los comentarios, corrige y vuelve a subir la nueva versión.`;
        console.log(`[JURADOS] Cambiando estado a: ${nuevoEstado}`);
      } else if (aprobados >= 2) {
        // 2 O MÁS JURADOS APROBARON
        nuevoEstado = "APROBADO_JURADOS";
        mensajeEstudiante = `¡Felicidades! Tu proyecto "${info[0]?.titulo}" fue aprobado por la mayoría de jurados.`;
        console.log(`[JURADOS] Cambiando estado a: ${nuevoEstado}`);
      }

      // Actualizar estado del proyecto
      await pool.query(
        `UPDATE proyecto_tesis 
         SET estado_proyecto = ? 
         WHERE id_proyecto = ?`,
        [nuevoEstado, id_proyecto]
      );

      // Notificar al estudiante
      if (info.length > 0) {
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
            observados === 3
              ? "Proyecto observado por jurados"
              : aprobados === 3
              ? "Proyecto aprobado por jurados"
              : "Evaluación de jurados completada",
            mensajeEstudiante
          );
        }
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
      SELECT b.id_borrador, b.numero_iteracion, b.estado, b.ruta_pdf, p.id_proyecto,
             p.titulo, pj.rol_jurado,
             CONCAT(per.nombres,' ',per.apellido_paterno,' ',per.apellido_materno) AS estudiante
      FROM tesis_borrador b
      JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
      JOIN proyecto_jurado pj ON pj.id_proyecto = p.id_proyecto
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona per ON per.id_persona = e.id_persona
      WHERE pj.id_jurado = ?
        AND b.estado = 'APROBADO_ASESOR'
        AND NOT EXISTS (
          SELECT 1 FROM revision_borrador_jurado r 
          WHERE r.id_borrador = b.id_borrador 
          AND r.id_jurado = pj.id_jurado
        )
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

    // Verificar si ya revisó
    const [yaReviso] = await pool.query(
      `SELECT 1 FROM revision_borrador_jurado WHERE id_borrador=? AND id_jurado=?`,
      [id_borrador, id_docente]
    );

    if (yaReviso.length > 0) {
      return res.status(400).json({ message: "Ya has revisado este borrador" });
    }

    // Registrar revisión
    await pool.query(
      `
      INSERT INTO revision_borrador_jurado
      (id_borrador, id_jurado, estado_revision, comentarios)
      VALUES (?, ?, ?, ?)
      `,
      [id_borrador, id_docente, estado_revision, comentarios || null]
    );

    // Verificar cuántos jurados han revisado
    const [revisiones] = await pool.query(
      `SELECT estado_revision 
        FROM revision_borrador_jurado
        WHERE id_borrador = ?`,
      [id_borrador]
    );

    // Cantidad total de jurados asignados
    const [totalJur] = await pool.query(
      `SELECT COUNT(*) AS total FROM proyecto_jurado WHERE id_proyecto=?`,
      [id_proyecto]
    );

    const total = totalJur[0].total;

    // Si aún faltan revisiones, esperar a que todos revisen
    if (revisiones.length < total) {
      return res.json({
        message:
          "Revisión registrada. Esperando a que los demás jurados revisen.",
      });
    }

    // Los 3 jurados ya revisaron - calcular mayoría
    const aprobados = revisiones.filter(
      (r) => r.estado_revision === "APROBADO"
    ).length;

    const observados = revisiones.filter(
      (r) => r.estado_revision === "OBSERVADO"
    ).length;

    let nuevoEstado = "";
    let mensajeEstudiante = "";
    let mensajeCoord = "";

    // Determinar resultado por mayoría
    if (aprobados >= 2) {
      nuevoEstado = "APROBADO_JURADOS";
      mensajeEstudiante = `Tu borrador de tesis "${titulo}" ha sido aprobado por la mayoría de los jurados (${aprobados} de ${total}).`;
      mensajeCoord = `El borrador de la tesis "${titulo}" ha sido aprobado por la mayoría de los jurados (${aprobados} de ${total}).`;
    } else {
      nuevoEstado = "OBSERVADO_JURADOS";
      mensajeEstudiante = `Tu borrador de tesis "${titulo}" ha sido observado por la mayoría de los jurados (${observados} de ${total}). Revisa los comentarios y vuelve a enviar.`;
      mensajeCoord = `El borrador de la tesis "${titulo}" ha sido observado por la mayoría de los jurados (${observados} de ${total}).`;
    }

    // Actualizar estado del borrador
    await pool.query(`UPDATE tesis_borrador SET estado=? WHERE id_borrador=?`, [
      nuevoEstado,
      id_borrador,
    ]);

    // Notificar estudiante
    const [usrEst] = await pool.query(
      `SELECT u.id_usuario
        FROM usuario u JOIN estudiante e ON e.id_persona=u.id_persona
        WHERE e.id_estudiante=?`,
      [id_estudiante]
    );

    await notificar(
      usrEst[0].id_usuario,
      nuevoEstado === "APROBADO_JURADOS"
        ? "Borrador aprobado por jurados"
        : "Borrador observado por jurados",
      mensajeEstudiante
    );

    // Notificar coordinación
    const [coord] = await pool.query(
      `SELECT id_usuario FROM usuario WHERE id_rol = 3`
    );

    for (const c of coord) {
      await notificar(
        c.id_usuario,
        nuevoEstado === "APROBADO_JURADOS"
          ? "Borrador aprobado por jurados"
          : "Borrador observado por jurados",
        mensajeCoord
      );
    }

    return res.json({
      message:
        nuevoEstado === "APROBADO_JURADOS"
          ? "Borrador aprobado por mayoría de jurados"
          : "Borrador observado por mayoría de jurados",
    });
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
