const pool = require("../config/database");
const { notificar } = require("../utils/notificar");

// =========================
// ETAPA 1 — SUBIR PROYECTO
// =========================
const subirProyecto = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;

    if (rol !== "ESTUDIANTE")
      return res
        .status(403)
        .json({ message: "Acceso permitido solo a estudiantes" });

    if (!req.file)
      return res.status(400).json({ message: "Debe adjuntar un archivo PDF" });

    const { titulo, resumen, id_especialidad, id_asesor } = req.body;

    // Determinar estado del asesor
    const estado_asesor = id_asesor ? "PROPUESTO" : "SIN_ASESOR";

    // Insertar proyecto con asesor propuesto (si existe)
    const [result] = await pool.query(
      `INSERT INTO proyecto_tesis
        (id_estudiante, id_especialidad, id_asesor, estado_asesor, titulo, resumen, ruta_pdf)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_estudiante,
        id_especialidad,
        id_asesor || null,
        estado_asesor,
        titulo,
        resumen,
        req.file.filename,
      ]
    );

    const id_proyecto = result.insertId;

    // Si se propuso un asesor, notificarlo
    if (id_asesor) {
      const [userAsesor] = await pool.query(
        `SELECT u.id_usuario
         FROM usuario u
         JOIN docente d ON d.id_persona = u.id_persona
         WHERE d.id_docente=?`,
        [id_asesor]
      );

      if (userAsesor.length > 0) {
        await notificar(
          userAsesor[0].id_usuario,
          "Propuesta de asesoría",
          `Has sido propuesto como asesor del proyecto "${titulo}".`
        );
      }
    }

    // Notificar a coordinación
    const [coord] = await pool.query(
      `SELECT id_usuario FROM usuario WHERE id_rol = 3`
    );

    // Crear mensaje personalizado según si hay asesor propuesto
    let mensajeCoord = `Se ha registrado un nuevo proyecto: "${titulo}".`;
    if (id_asesor) {
      const [asesorInfo] = await pool.query(
        `SELECT CONCAT(p.nombres, ' ', p.apellido_paterno, ' ', p.apellido_materno) AS nombre_asesor
         FROM persona p
         JOIN docente d ON d.id_persona = p.id_persona
         WHERE d.id_docente = ?`,
        [id_asesor]
      );

      if (asesorInfo.length > 0) {
        mensajeCoord = `Se ha registrado un nuevo proyecto: "${titulo}". Se propuso como asesor a ${asesorInfo[0].nombre_asesor}.`;
      }
    }

    for (const c of coord) {
      await notificar(c.id_usuario, "Nuevo proyecto registrado", mensajeCoord);
    }

    res.json({
      message: "Proyecto subido correctamente",
      id_proyecto: id_proyecto,
    });
  } catch (err) {
    console.error("ERROR subirProyecto:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// ============================
// ACTUALIZAR PROYECTO
// ============================
const actualizarProyecto = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;
    const { id_proyecto } = req.params;

    if (rol !== "ESTUDIANTE")
      return res
        .status(403)
        .json({ message: "Acceso permitido solo a estudiantes" });

    const { titulo, resumen, id_especialidad, id_asesor } = req.body;

    // Verificar que el proyecto pertenece al estudiante
    const [proyecto] = await pool.query(
      `SELECT * FROM proyecto_tesis 
       WHERE id_proyecto = ? AND id_estudiante = ?`,
      [id_proyecto, id_estudiante]
    );

    if (proyecto.length === 0) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    const estadoActual = proyecto[0].estado_proyecto;

    // Validar que el proyecto está en un estado que permite actualización
    if (
      !["OBSERVADO_FORMATO", "OBSERVADO_ASESOR", "OBSERVADO_JURADOS"].includes(
        estadoActual
      )
    ) {
      return res.status(400).json({
        message: "Solo se pueden actualizar proyectos observados",
      });
    }

    let updateQuery;
    let params;
    let nuevaIteracion;
    let nuevoEstado;

    // ========================================
    // CASO 1: OBSERVADO POR COORDINADOR
    // ========================================
    if (estadoActual === "OBSERVADO_FORMATO") {
      nuevaIteracion = proyecto[0].iteracion + 1;
      nuevoEstado = "PENDIENTE";

      updateQuery = `UPDATE proyecto_tesis SET 
        titulo = ?, 
        resumen = ?, 
        id_especialidad = ?, 
        id_asesor = ?,
        iteracion = ?,
        estado_proyecto = ?,
        fecha_subida = CURRENT_TIMESTAMP`;

      params = [
        titulo,
        resumen,
        id_especialidad,
        id_asesor || null,
        nuevaIteracion,
        nuevoEstado,
      ];

      // Si hay nuevo archivo, actualizar ruta_pdf
      if (req.file) {
        updateQuery += `, ruta_pdf = ?`;
        params.push(req.file.filename);
      }

      updateQuery += ` WHERE id_proyecto = ?`;
      params.push(id_proyecto);

      await pool.query(updateQuery, params);

      // Notificar a coordinación
      const [coord] = await pool.query(
        `SELECT id_usuario FROM usuario WHERE id_rol = 3`
      );

      for (const c of coord) {
        await notificar(
          c.id_usuario,
          "Proyecto corregido",
          `El estudiante ha resubido el proyecto "${titulo}" (Iteración ${nuevaIteracion}).`
        );
      }
    }
    // ========================================
    // CASO 2: OBSERVADO POR ASESOR
    // ========================================
    else if (estadoActual === "OBSERVADO_ASESOR") {
      // NO incrementar iteración, el proyecto ya pasó por coordinación
      nuevaIteracion = proyecto[0].iteracion;
      nuevoEstado = "REVISADO_FORMATO"; // Vuelve a la cola del asesor

      updateQuery = `UPDATE proyecto_tesis SET 
        titulo = ?, 
        resumen = ?, 
        estado_proyecto = ?,
        fecha_subida = CURRENT_TIMESTAMP`;

      params = [titulo, resumen, nuevoEstado];

      // Si hay nuevo archivo, actualizar ruta_pdf
      if (req.file) {
        updateQuery += `, ruta_pdf = ?`;
        params.push(req.file.filename);
      }

      updateQuery += ` WHERE id_proyecto = ?`;
      params.push(id_proyecto);

      await pool.query(updateQuery, params);

      // Notificar al asesor
      const id_asesor_actual = proyecto[0].id_asesor;
      if (id_asesor_actual) {
        const [userAsesor] = await pool.query(
          `SELECT u.id_usuario
           FROM usuario u
           JOIN docente d ON d.id_persona = u.id_persona
           WHERE d.id_docente = ?`,
          [id_asesor_actual]
        );

        if (userAsesor.length > 0) {
          await notificar(
            userAsesor[0].id_usuario,
            "Proyecto corregido",
            `El estudiante ha resubido el proyecto "${titulo}" con las correcciones solicitadas.`
          );
        }
      }

      // NO notificar a coordinación (ya aprobó el formato)
    }
    // ========================================
    // CASO 3: OBSERVADO POR JURADOS
    // ========================================
    else if (estadoActual === "OBSERVADO_JURADOS") {
      // NO incrementar iteración
      nuevaIteracion = proyecto[0].iteracion;
      nuevoEstado = "ASIGNADO_JURADOS"; // Vuelve directamente a los jurados

      updateQuery = `UPDATE proyecto_tesis SET 
        titulo = ?, 
        resumen = ?, 
        estado_proyecto = ?,
        fecha_subida = CURRENT_TIMESTAMP`;

      params = [titulo, resumen, nuevoEstado];

      // Si hay nuevo archivo, actualizar ruta_pdf (OBLIGATORIO)
      if (req.file) {
        updateQuery += `, ruta_pdf = ?`;
        params.push(req.file.filename);
      } else {
        return res.status(400).json({
          message: "Debe subir el PDF corregido del proyecto",
        });
      }

      updateQuery += ` WHERE id_proyecto = ?`;
      params.push(id_proyecto);

      await pool.query(updateQuery, params);

      // ELIMINAR las revisiones anteriores de los jurados
      await pool.query(
        `DELETE FROM revision_proyecto_jurado WHERE id_proyecto = ?`,
        [id_proyecto]
      );

      // Notificar a los jurados
      const [jurados] = await pool.query(
        `SELECT pj.id_jurado, pj.rol_jurado
         FROM proyecto_jurado pj
         WHERE pj.id_proyecto = ?`,
        [id_proyecto]
      );

      for (const jurado of jurados) {
        const [userJurado] = await pool.query(
          `SELECT u.id_usuario
           FROM usuario u
           JOIN docente d ON d.id_persona = u.id_persona
           WHERE d.id_docente = ?`,
          [jurado.id_jurado]
        );

        if (userJurado.length > 0) {
          await notificar(
            userJurado[0].id_usuario,
            "Proyecto corregido para revisión",
            `El estudiante ha resubido el proyecto "${titulo}" con las correcciones. Por favor revísalo nuevamente.`
          );
        }
      }
    }

    res.json({
      message: "Proyecto actualizado correctamente",
      id_proyecto: id_proyecto,
      iteracion: nuevaIteracion,
    });
  } catch (err) {
    console.error("ERROR actualizarProyecto:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// ============================
// OBTENER PROYECTO POR ID
// ============================
const getProyectoById = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;
    const { id_proyecto } = req.params;

    if (rol !== "ESTUDIANTE")
      return res
        .status(403)
        .json({ message: "Acceso permitido solo a estudiantes" });

    const [proyecto] = await pool.query(
      `SELECT 
        p.*,
        CONCAT(pers.nombres, ' ', pers.apellido_paterno, ' ', pers.apellido_materno) AS nombre_asesor
       FROM proyecto_tesis p
       LEFT JOIN docente d ON d.id_docente = p.id_asesor
       LEFT JOIN persona pers ON pers.id_persona = d.id_persona
       WHERE p.id_proyecto = ? AND p.id_estudiante = ?`,
      [id_proyecto, id_estudiante]
    );

    if (proyecto.length === 0) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    res.json(proyecto[0]);
  } catch (err) {
    console.error("ERROR getProyectoById:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// ========================
// ETAPA 1 — ELEGIR ASESOR
// ========================
const elegirAsesor = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;
    if (rol !== "ESTUDIANTE")
      return res
        .status(403)
        .json({ message: "Solo estudiantes pueden elegir asesor" });

    const { id_proyecto } = req.params;
    const { id_asesor } = req.body;

    const [proy] = await pool.query(
      `SELECT p.id_especialidad, p.titulo
       FROM proyecto_tesis p
       WHERE p.id_proyecto = ? AND p.id_estudiante = ?`,
      [id_proyecto, id_estudiante]
    );

    if (proy.length === 0)
      return res.status(403).json({ message: "Este proyecto no te pertenece" });

    const { id_especialidad, titulo } = proy[0];

    // Validar especialidad del asesor
    const [validAsesor] = await pool.query(
      `SELECT * FROM docente_especialidad
       WHERE id_docente = ? AND id_especialidad = ?`,
      [id_asesor, id_especialidad]
    );

    if (validAsesor.length === 0)
      return res.status(400).json({
        message: "El asesor no pertenece a la especialidad del proyecto",
      });

    // Actualizar proyecto
    await pool.query(
      `UPDATE proyecto_tesis
       SET id_asesor=?, estado_asesor='PROPUESTO'
       WHERE id_proyecto=?`,
      [id_asesor, id_proyecto]
    );

    // Notificar al asesor
    const [userAsesor] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u
       JOIN docente d ON d.id_persona = u.id_persona
       WHERE d.id_docente=?`,
      [id_asesor]
    );

    if (userAsesor.length > 0) {
      await notificar(
        userAsesor[0].id_usuario,
        "Propuesta de asesoría",
        `Has sido propuesto como asesor del proyecto "${titulo}".`
      );
    }

    // Notificar a coordinación
    const [coord] = await pool.query(
      `SELECT id_usuario FROM usuario WHERE id_rol=3`
    );
    for (const c of coord) {
      await notificar(
        c.id_usuario,
        "Asesor pendiente de aprobación",
        `Se ha propuesto un asesor para el proyecto "${titulo}".`
      );
    }

    res.json({ message: "Asesor propuesto. Pendiente aprobación." });
  } catch (err) {
    console.error("ERROR elegirAsesor:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// ========================
// ETAPA 2 — SUBIR BORRADOR
// ========================
const subirBorrador = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;

    if (rol !== "ESTUDIANTE")
      return res.status(403).json({ message: "Acceso restringido" });

    if (!req.file)
      return res.status(400).json({ message: "Debe adjuntar un archivo PDF" });

    const { id_proyecto } = req.body;

    // Validar propiedad del proyecto
    const [proy] = await pool.query(
      `SELECT * FROM proyecto_tesis WHERE id_proyecto=? AND id_estudiante=?`,
      [id_proyecto, id_estudiante]
    );

    if (proy.length === 0)
      return res
        .status(403)
        .json({ message: "El proyecto no pertenece al estudiante" });

    // Número de iteración
    const [iter] = await pool.query(
      `SELECT COUNT(*) AS total FROM tesis_borrador WHERE id_proyecto=?`,
      [id_proyecto]
    );

    const numero_iteracion = iter[0].total + 1;

    const [result] = await pool.query(
      `INSERT INTO tesis_borrador (id_proyecto, numero_iteracion, ruta_pdf)
       VALUES (?, ?, ?)`,
      [id_proyecto, numero_iteracion, req.file.filename]
    );

    // ========================
    // NOTIFICAR COORDINACIÓN
    // ========================
    const [coord] = await pool.query(
      `SELECT id_usuario FROM usuario WHERE id_rol = 3`
    );
    for (const c of coord) {
      await notificar(
        c.id_usuario,
        "Nuevo borrador enviado",
        `El estudiante ha subido un nuevo borrador del proyecto.`
      );
    }

    // ========================
    // NOTIFICAR ASESOR
    // ========================
    const [asesorUser] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u
       JOIN docente d ON d.id_persona = u.id_persona
       JOIN proyecto_tesis p ON p.id_asesor = d.id_docente
       WHERE p.id_proyecto = ?`,
      [id_proyecto]
    );

    if (asesorUser.length > 0) {
      await notificar(
        asesorUser[0].id_usuario,
        "Nuevo borrador disponible",
        "El estudiante subió un nuevo borrador para revisión."
      );
    }

    res.json({
      message: "Borrador subido correctamente",
      id_borrador: result.insertId,
      numero_iteracion,
    });
  } catch (err) {
    console.error("ERROR subirBorrador:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// Etapa 3
const subirTesisFinal = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;

    if (rol !== "ESTUDIANTE")
      return res.status(403).json({ message: "Solo estudiantes" });

    if (!req.file)
      return res.status(400).json({ message: "Debe adjuntar un archivo PDF" });

    const { id_proyecto } = req.body;

    // Validar proyecto
    const [proy] = await pool.query(
      `SELECT * FROM proyecto_tesis 
       WHERE id_proyecto=? AND id_estudiante=?`,
      [id_proyecto, id_estudiante]
    );

    if (!proy.length)
      return res
        .status(403)
        .json({ message: "Proyecto no pertenece al estudiante" });

    // Validar estado
    if (proy[0].estado_proyecto !== "APROBADO_FINAL")
      return res.status(400).json({
        message: "El proyecto aún no está aprobado por jurados",
      });

    // Validar borrador aprobado
    const [bor] = await pool.query(
      `SELECT 1 FROM tesis_borrador
       WHERE id_proyecto=? AND estado='APROBADO_JURADOS'
       LIMIT 1`,
      [id_proyecto]
    );

    if (!bor.length)
      return res.status(400).json({
        message: "Debe existir un borrador aprobado por jurados",
      });

    // Insertar tesis final
    await pool.query(
      `INSERT INTO tesis (id_proyecto, ruta_pdf)
       VALUES (?, ?)`,
      [id_proyecto, req.file.filename]
    );

    res.json({ message: "Tesis final registrada correctamente" });
  } catch (err) {
    console.error("ERROR subirTesisFinal:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

const misResoluciones = async (req, res) => {
  try {
    const { id_estudiante } = req.user;

    const [rows] = await pool.query(
      `SELECT r.numero_resolucion, r.fecha_resolucion, r.id_resolucion
       FROM resolucion r
       JOIN proyecto_tesis p ON p.id_proyecto=r.id_proyecto
       WHERE p.id_estudiante=?`,
      [id_estudiante]
    );

    res.json(rows);
  } catch (err) {
    console.error("ERROR misResoluciones:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// GET mis proyectos
const misProyectos = async (req, res) => {
  try {
    const { id_estudiante } = req.user;

    // Validar que el usuario tenga id_estudiante
    if (!id_estudiante) {
      return res.status(403).json({
        message: "El usuario no es un estudiante",
      });
    }

    const [rows] = await pool.query(
      `SELECT 
        p.id_proyecto,
        p.titulo,
        p.resumen,
        p.ruta_pdf,
        p.estado_proyecto,
        p.estado_asesor,
        p.fecha_subida,
        CONCAT(pers.nombres, ' ', pers.apellido_paterno, ' ', pers.apellido_materno) AS nombre_asesor
       FROM proyecto_tesis p
       LEFT JOIN docente d ON d.id_docente = p.id_asesor
       LEFT JOIN persona pers ON pers.id_persona = d.id_persona
       WHERE p.id_estudiante = ?
       ORDER BY p.fecha_subida DESC`,
      [id_estudiante]
    );

    res.json(rows);
  } catch (err) {
    console.error("ERROR misProyectos:", err);
    res.status(500).json({ message: "Error interno", error: err.message });
  }
};

// GET mis borradores
const misBorradores = async (req, res) => {
  try {
    const { id_estudiante } = req.user;

    const [rows] = await pool.query(
      `SELECT 
        b.id_borrador,
        b.id_proyecto,
        b.numero_iteracion,
        b.ruta_pdf,
        b.estado,
        b.fecha_subida,
        p.titulo AS titulo_proyecto
       FROM tesis_borrador b
       JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
       WHERE p.id_estudiante = ?
       ORDER BY b.fecha_subida DESC`,
      [id_estudiante]
    );

    res.json(rows);
  } catch (err) {
    console.error("ERROR misBorradores:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// GET mi acta
const miActa = async (req, res) => {
  try {
    const { id_estudiante } = req.user;

    const [rows] = await pool.query(
      `SELECT 
        a.id_acta,
        a.numero_acta,
        a.fecha_acta,
        s.nota,
        s.dictamen,
        p.titulo AS titulo_proyecto
       FROM acta_sustentacion a
       JOIN sustentacion s ON s.id_sustentacion = a.id_sustentacion
       JOIN proyecto_tesis p ON p.id_proyecto = s.id_proyecto
       WHERE p.id_estudiante = ?
       LIMIT 1`,
      [id_estudiante]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No se ha generado acta aún" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("ERROR miActa:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// GET revisión del asesor para un proyecto
const getRevisionAsesor = async (req, res) => {
  try {
    const { id_estudiante } = req.user;
    const { id_proyecto } = req.params;

    // Verificar que el proyecto pertenece al estudiante
    const [proyecto] = await pool.query(
      `SELECT * FROM proyecto_tesis WHERE id_proyecto = ? AND id_estudiante = ?`,
      [id_proyecto, id_estudiante]
    );

    if (proyecto.length === 0) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    // Obtener la última revisión del asesor
    const [revision] = await pool.query(
      `SELECT 
        r.estado_revision,
        r.comentarios,
        r.fecha_revision,
        CONCAT(p.nombres, ' ', p.apellido_paterno, ' ', p.apellido_materno) AS nombre_asesor
       FROM revision_proyecto_asesor r
       JOIN docente d ON d.id_docente = r.id_asesor
       JOIN persona p ON p.id_persona = d.id_persona
       WHERE r.id_proyecto = ?
       ORDER BY r.fecha_revision DESC
       LIMIT 1`,
      [id_proyecto]
    );

    if (revision.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay revisión del asesor aún" });
    }

    res.json(revision[0]);
  } catch (err) {
    console.error("ERROR getRevisionAsesor:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

module.exports = {
  subirProyecto,
  actualizarProyecto,
  getProyectoById,
  elegirAsesor,
  subirBorrador,
  subirTesisFinal,
  misResoluciones,
  misProyectos,
  misBorradores,
  miActa,
  getRevisionAsesor,
};
