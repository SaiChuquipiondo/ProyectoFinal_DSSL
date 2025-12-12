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

    const { titulo, resumen, id_especialidad } = req.body;

    const [result] = await pool.query(
      `INSERT INTO proyecto_tesis
        (id_estudiante, id_especialidad, titulo, resumen, ruta_pdf)
       VALUES (?, ?, ?, ?, ?)`,
      [id_estudiante, id_especialidad, titulo, resumen, req.file.filename]
    );

    // Notificar a coordinación
    const [coord] = await pool.query(
      `SELECT id_usuario FROM usuario WHERE id_rol = 3`
    );

    for (const c of coord) {
      await notificar(
        c.id_usuario,
        "Nuevo proyecto registrado",
        `Se ha registrado un nuevo proyecto: "${titulo}".`
      );
    }

    res.json({
      message: "Proyecto subido correctamente",
      id_proyecto: result.insertId,
    });
  } catch (err) {
    console.error("ERROR subirProyecto:", err);
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

    // Validar proyecto y estado
    const [proy] = await pool.query(
      `SELECT * FROM proyecto_tesis 
       WHERE id_proyecto=? AND id_estudiante=?`,
      [id_proyecto, id_estudiante]
    );

    if (proy.length === 0)
      return res
        .status(403)
        .json({ message: "Proyecto no pertenece al estudiante" });

    if (proy[0].estado_proyecto !== "APROBADO_FINAL")
      return res.status(400).json({
        message: "El proyecto aún no está aprobado por jurados.",
      });

    // Validar borrador aprobado por jurados
    const [bor] = await pool.query(
      `SELECT * FROM tesis_borrador
       WHERE id_proyecto=? AND estado='APROBADO_JURADOS'
       ORDER BY numero_iteracion DESC LIMIT 1`,
      [id_proyecto]
    );

    if (bor.length === 0)
      return res.status(400).json({
        message: "Debe tener un borrador aprobado por jurados.",
      });

    // Revisar si ya existe tesis para este proyecto
    const [tesis] = await pool.query(
      `SELECT * FROM tesis WHERE id_proyecto=?`,
      [id_proyecto]
    );

    if (tesis.length === 0) {
      // Crear nueva tesis
      await pool.query(
        `INSERT INTO tesis 
          (id_proyecto, id_estudiante, id_especialidad, id_asesor, titulo, resumen, ruta_pdf)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          proy[0].id_proyecto,
          proy[0].id_estudiante,
          proy[0].id_especialidad,
          proy[0].id_asesor,
          proy[0].titulo,
          proy[0].resumen,
          req.file.filename,
        ]
      );
    } else {
      // Reemplazar PDF final existente
      await pool.query(
        `UPDATE tesis SET ruta_pdf=?, fecha_subida=NOW()
         WHERE id_tesis=?`,
        [req.file.filename, tesis[0].id_tesis]
      );
    }

    res.json({ message: "Tesis final registrada correctamente" });
  } catch (err) {
    console.error("ERROR subirTesisFinal:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

const misResoluciones = async (req, res) => {
  const { id_estudiante } = req.user;

  const [rows] = await pool.query(
    `
    SELECT r.numero_resolucion, r.fecha_resolucion, r.id_resolucion
    FROM resolucion r
    JOIN proyecto_tesis p ON p.id_proyecto=r.id_proyecto
    WHERE p.id_estudiante=?`,
    [id_estudiante]
  );

  res.json(rows);
};
module.exports = {
  subirProyecto,
  elegirAsesor,
  subirBorrador,
  subirTesisFinal,
  misResoluciones,
};
