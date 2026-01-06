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

    // Extraer solo el nombre del archivo (sin la carpeta)
    // En Cloudinary: "proyectos/proyecto_xxx.pdf" -> "proyecto_xxx.pdf"
    // En local: "proyecto_xxx.pdf" -> "proyecto_xxx.pdf"
    const rutaPdf = req.file.filename.split("/").pop();

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
        rutaPdf,
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
// ACTUALIZAR PROYECTO (RESUBMISIÓN)
// ============================
const actualizarProyecto = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;
    const { id_proyecto } = req.params;

    if (rol !== "ESTUDIANTE")
      return res
        .status(403)
        .json({ message: "Acceso permitido solo a estudiantes" });

    // Obtener proyecto actual
    const [proyecto] = await pool.query(
      `SELECT p.*, p.estado_proyecto
       FROM proyecto_tesis p
       WHERE p.id_proyecto = ? AND p.id_estudiante = ?`,
      [id_proyecto, id_estudiante]
    );

    if (proyecto.length === 0) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    const proyectoActual = proyecto[0];

    // Verificar que está en estado OBSERVADO
    const estadosObservados = [
      "OBSERVADO_FORMATO",
      "OBSERVADO_ASESOR",
      "OBSERVADO_JURADOS",
    ];
    if (!estadosObservados.includes(proyectoActual.estado_proyecto)) {
      return res.status(400).json({
        message: "Solo se pueden actualizar proyectos observados",
      });
    }

    const { titulo, resumen, id_especialidad, id_asesor } = req.body;

    // Determinar nuevo estado según quién lo observó
    let nuevoEstado = "PENDIENTE";
    let resetearRevisiones = false;

    if (proyectoActual.estado_proyecto === "OBSERVADO_FORMATO") {
      // Si fue observado por formato (coordinación), vuelve a PENDIENTE
      nuevoEstado = "PENDIENTE";
    } else if (proyectoActual.estado_proyecto === "OBSERVADO_ASESOR") {
      // Si fue observado por el asesor, vuelve a PENDIENTE
      nuevoEstado = "REVISADO_FORMATO";
    } else if (proyectoActual.estado_proyecto === "OBSERVADO_JURADOS") {
      // Si fue observado por jurados, vuelve directamente a revisión de jurados
      nuevoEstado = "APROBADO_COORD";
      resetearRevisiones = true;
    }

    // Si hay nuevo archivo PDF, actualizar y eliminar el anterior
    if (req.file) {
      const { deleteFile } = require("../utils/fileStorage");

      // Eliminar el archivo anterior (funciona tanto en local como en Cloudinary)
      await deleteFile(proyectoActual.ruta_pdf, "proyectos");

      // Obtener el nombre del archivo según el storage
      // En Cloudinary: "proyectos/proyecto_xxx.pdf" -> "proyecto_xxx.pdf"
      // En local: "proyecto_xxx.pdf" -> "proyecto_xxx.pdf"
      const nuevaRutaPdf = req.file.filename.split("/").pop();

      // Actualizar proyecto con nuevo PDF
      await pool.query(
        `UPDATE proyecto_tesis 
         SET titulo = ?, 
             resumen = ?, 
             id_especialidad = ?, 
             id_asesor = ?, 
             ruta_pdf = ?, 
             estado_proyecto = ?,
             fecha_subida = CURRENT_TIMESTAMP
         WHERE id_proyecto = ?`,
        [
          titulo,
          resumen,
          id_especialidad,
          id_asesor || null,
          nuevaRutaPdf,
          nuevoEstado,
          id_proyecto,
        ]
      );
    } else {
      // Actualizar sin cambiar PDF
      await pool.query(
        `UPDATE proyecto_tesis 
         SET titulo = ?, 
             resumen = ?, 
             id_especialidad = ?, 
             id_asesor = ?, 
             estado_proyecto = ?,
             fecha_subida = CURRENT_TIMESTAMP
         WHERE id_proyecto = ?`,
        [
          titulo,
          resumen,
          id_especialidad,
          id_asesor || null,
          nuevoEstado,
          id_proyecto,
        ]
      );
    }

    // Si fue observado por jurados, limpiar las revisiones anteriores
    if (resetearRevisiones) {
      await pool.query(`DELETE FROM revision_jurado WHERE id_proyecto = ?`, [
        id_proyecto,
      ]);
    }

    // Notificar a coordinación
    const [coord] = await pool.query(
      `SELECT id_usuario FROM usuario WHERE id_rol = 3`
    );
    for (const c of coord) {
      await notificar(
        c.id_usuario,
        "Proyecto corregido",
        `El estudiante ha corregido y reenviado el proyecto "${titulo}".`
      );
    }

    // Si fue observado por jurados, notificar a los jurados que deben revisar nuevamente
    if (proyectoActual.estado_proyecto === "OBSERVADO_JURADOS") {
      const [jurados] = await pool.query(
        `SELECT DISTINCT u.id_usuario
         FROM usuario u
         JOIN docente d ON d.id_persona = u.id_persona
         JOIN asignacion_jurado aj ON aj.id_jurado = d.id_docente
         WHERE aj.id_proyecto = ?`,
        [id_proyecto]
      );

      for (const jurado of jurados) {
        await notificar(
          jurado.id_usuario,
          "Proyecto corregido - Nueva revisión",
          `El estudiante ha corregido el proyecto "${titulo}". Por favor, revisa nuevamente.`
        );
      }
    }

    res.json({
      message: "Proyecto actualizado correctamente",
      id_proyecto: id_proyecto,
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

    // Extraer solo el nombre del archivo  (sin la carpeta)
    const rutaPdf = req.file.filename.split("/").pop();

    const [result] = await pool.query(
      `INSERT INTO tesis_borrador (id_proyecto, numero_iteracion, ruta_pdf)
       VALUES (?, ?, ?)`,
      [id_proyecto, numero_iteracion, rutaPdf]
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

// ========================
// ACTUALIZAR BORRADOR (CORRECCIÓN)
// ========================
const actualizarBorrador = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;

    if (rol !== "ESTUDIANTE")
      return res.status(403).json({ message: "Acceso restringido" });

    const { id_borrador } = req.params;

    // Verificar que el borrador pertenece al estudiante
    const [borrador] = await pool.query(
      `SELECT b.*, p.id_estudiante 
       FROM tesis_borrador b
       JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
       WHERE b.id_borrador = ?`,
      [id_borrador]
    );

    if (borrador.length === 0 || borrador[0].id_estudiante !== id_estudiante)
      return res.status(403).json({
        message: "Borrador no encontrado o no pertenece al estudiante",
      });

    // Verificar que está en estado OBSERVADO (por coord, asesor o jurados)
    const estadosObservados = [
      "OBSERVADO",
      "OBSERVADO_ASESOR",
      "OBSERVADO_JURADOS",
    ];
    if (!estadosObservados.includes(borrador[0].estado))
      return res
        .status(400)
        .json({ message: "Solo se pueden corregir borradores observados" });

    // Si hay nuevo archivo PDF, actualizar ruta, iteración, fecha y estado
    if (req.file) {
      // Eliminar PDF anterior del servidor (funciona tanto en local como en Cloudinary)
      const { deleteFile } = require("../utils/fileStorage");
      await deleteFile(borrador[0].ruta_pdf, "borradores");

      // Incrementamos la iteración
      const nuevaIteracion = borrador[0].numero_iteracion + 1;

      // Determinar nuevo estado según quién lo observó
      let nuevoEstado = "PENDIENTE";

      if (borrador[0].estado === "OBSERVADO_ASESOR") {
        nuevoEstado = "APROBADO_CORD";
      } else if (borrador[0].estado === "OBSERVADO_JURADOS") {
        nuevoEstado = "APROBADO_ASESOR";
        // Limpiar revisiones anteriores de jurados
        await pool.query(
          `DELETE FROM revision_borrador_jurado WHERE id_borrador = ?`,
          [id_borrador]
        );
      }

      // Actualizar borrador
      // Extraer solo el nombre del archivo (sin la carpeta)
      const rutaPdf = req.file.filename.split("/").pop();

      await pool.query(
        `UPDATE tesis_borrador 
         SET ruta_pdf = ?, 
             estado = ?,
             numero_iteracion = ?,
             fecha_subida = CURRENT_TIMESTAMP
         WHERE id_borrador = ?`,
        [rutaPdf, nuevoEstado, nuevaIteracion, id_borrador]
      );
    } else {
      // Si no hay archivo (raro), mantener la lógica de estados
      let nuevoEstado = "PENDIENTE";
      if (borrador[0].estado === "OBSERVADO_ASESOR") {
        nuevoEstado = "APROBADO_CORD";
      } else if (borrador[0].estado === "OBSERVADO_JURADOS") {
        nuevoEstado = "APROBADO_ASESOR";
        await pool.query(
          `DELETE FROM revision_borrador_jurado WHERE id_borrador = ?`,
          [id_borrador]
        );
      }

      await pool.query(
        `UPDATE tesis_borrador 
         SET estado = ?,
             fecha_subida = CURRENT_TIMESTAMP
         WHERE id_borrador = ?`,
        [nuevoEstado, id_borrador]
      );
    }

    // Notificar a coordinación
    const [coord] = await pool.query(
      `SELECT id_usuario FROM usuario WHERE id_rol = 3`
    );
    for (const c of coord) {
      await notificar(
        c.id_usuario,
        "Borrador corregido",
        `El estudiante ha corregido y reenviado un borrador para revisión.`
      );
    }

    res.json({
      message: "Borrador actualizado correctamente",
      id_borrador: id_borrador,
    });
  } catch (err) {
    console.error("ERROR actualizarBorrador:", err);
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
        p.titulo AS titulo_proyecto,
        IFNULL((SELECT 1 FROM tesis t WHERE t.id_proyecto = b.id_proyecto LIMIT 1), 0) AS tiene_tesis_final
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

// (getRevisionAsesor eliminado por desuso - se incluye en getProyectoById)

// =========================
// ETAPA 3 — TESIS FINAL
// =========================

const subirTesisFinal = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;

    if (rol !== "ESTUDIANTE")
      return res
        .status(403)
        .json({ message: "Acceso permitido solo a estudiantes" });

    // Verificar que tiene un borrador con dictamen final aprobado
    const [borradorAprobado] = await pool.query(
      `SELECT b.id_borrador, b.id_proyecto, p.titulo
       FROM tesis_borrador b
       JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
       WHERE p.id_estudiante = ? AND b.estado = 'APROBADO_FINAL'
       LIMIT 1`,
      [id_estudiante]
    );

    if (borradorAprobado.length === 0) {
      return res.status(400).json({
        message:
          "No tienes un borrador con dictamen final aprobado. Debes esperar a que coordinación emita el dictamen final.",
      });
    }

    const { id_proyecto, titulo } = borradorAprobado[0];

    // Verificar que no haya ya subido tesis
    const [tesisExistente] = await pool.query(
      `SELECT id_tesis FROM tesis WHERE id_proyecto = ?`,
      [id_proyecto]
    );

    if (tesisExistente.length > 0) {
      return res.status(400).json({
        message: "Ya has subido la tesis final para este proyecto",
      });
    }

    // Guardar archivo
    const archivo = req.file;
    if (!archivo) {
      return res.status(400).json({ message: "Archivo PDF requerido" });
    }

    // Insertar en tabla tesis
    await pool.query(
      `INSERT INTO tesis (id_proyecto, ruta_pdf) VALUES (?, ?)`,
      [id_proyecto, archivo.filename]
    );

    // Notificar coordinación
    const [coord] = await pool.query(
      `SELECT id_usuario FROM usuario WHERE id_rol = 3`
    );

    for (const c of coord) {
      await notificar(
        c.id_usuario,
        "Nueva tesis final registrada",
        `El estudiante subió la tesis final del proyecto "${titulo}".`
      );
    }

    res.json({
      message: "Tesis final subida exitosamente",
      ruta_pdf: archivo.filename,
    });
  } catch (err) {
    console.error("ERROR subirTesisFinal:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

const obtenerMiTesisFinal = async (req, res) => {
  try {
    const { id_estudiante } = req.user;

    const [tesis] = await pool.query(
      `SELECT t.id_tesis, t.ruta_pdf, t.fecha_registro, t.estado,
              p.id_proyecto, p.titulo
       FROM tesis t
       JOIN proyecto_tesis p ON p.id_proyecto = t.id_proyecto
       WHERE p.id_estudiante = ?`,
      [id_estudiante]
    );

    if (tesis.length === 0) {
      return res.status(404).json({ message: "No se encontró tesis final" });
    }

    res.json(tesis[0]);
  } catch (err) {
    console.error("ERROR obtenerMiTesisFinal:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

module.exports = {
  subirProyecto,
  actualizarProyecto,
  getProyectoById,
  elegirAsesor,
  subirBorrador,
  actualizarBorrador,
  subirTesisFinal,
  obtenerMiTesisFinal,
  misResoluciones,
  misProyectos,
  misBorradores,
  miActa,
};
