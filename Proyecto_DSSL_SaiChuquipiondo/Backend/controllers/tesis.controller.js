const pool = require("../config/database");

const getMisTesis = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;

    if (rol !== "ESTUDIANTE") {
      return res.status(403).json({ message: "Acceso solo para estudiantes" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        t.id_tesis,
        t.titulo,
        t.resumen,
        t.fecha_registro,
        t.estado_tesis,
        t.ruta_pdf,
        e.nombre AS especialidad,
        CONCAT(p.apellido_paterno, ' ', p.apellido_materno, ', ', p.nombres) AS asesor
      FROM tesis t
      INNER JOIN especialidad e ON e.id_especialidad = t.id_especialidad
      INNER JOIN docente d ON d.id_docente = t.id_asesor
      INNER JOIN persona p ON p.id_persona = d.id_persona
      WHERE t.id_estudiante = ?
      `,
      [id_estudiante]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener tesis:", error);
    res.status(500).json({ message: "Error al obtener tesis" });
  }
};

const registrarTesis = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;

    if (rol !== "ESTUDIANTE") {
      return res
        .status(403)
        .json({ message: "Solo los estudiantes pueden registrar tesis" });
    }

    const { titulo, resumen, id_especialidad, id_asesor } = req.body;

    if (!titulo || !id_especialidad || !id_asesor) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    // Insert a BD
    const [result] = await pool.query(
      `
      INSERT INTO tesis (
        id_estudiante,
        id_especialidad,
        id_asesor,
        titulo,
        resumen,
        fecha_registro,
        estado_tesis
      ) VALUES (?, ?, ?, ?, ?, CURDATE(), 'REGISTRADA')
      `,
      [id_estudiante, id_especialidad, id_asesor, titulo, resumen]
    );

    res.json({
      message: "Tesis registrada correctamente",
      id_tesis: result.insertId,
    });
  } catch (error) {
    console.error("Error al registrar tesis:", error);
    res.status(500).json({ message: "Error al registrar tesis" });
  }
};
// SUBIR PDF DE TESIS + CREAR VERSION
const subirVersion = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;
    const { id_tesis } = req.params;

    if (rol !== "ESTUDIANTE") {
      return res
        .status(403)
        .json({ message: "Solo los estudiantes pueden subir archivos" });
    }

    // Validar archivo
    if (!req.file) {
      return res.status(400).json({ message: "Debe enviar un archivo PDF" });
    }

    // Verificar que la tesis pertenece al estudiante
    const [tesis] = await pool.query(
      "SELECT id_tesis FROM tesis WHERE id_tesis = ? AND id_estudiante = ?",
      [id_tesis, id_estudiante]
    );

    if (tesis.length === 0) {
      return res
        .status(404)
        .json({ message: "La tesis no existe o no pertenece al estudiante" });
    }

    // Obtener número de versión (n+1)
    const [versions] = await pool.query(
      "SELECT COUNT(*) AS total FROM tesis_version WHERE id_tesis = ?",
      [id_tesis]
    );

    const numero_version = versions[0].total + 1;

    // Insertar versión
    await pool.query(
      `
      INSERT INTO tesis_version (id_tesis, numero_version, ruta_pdf, enviado_por)
      VALUES (?, ?, ?, 'ESTUDIANTE')
      `,
      [id_tesis, numero_version, req.file.filename]
    );

    res.json({
      message: "Versión subida correctamente",
      version: numero_version,
      archivo: req.file.filename,
    });
  } catch (error) {
    console.error("Error al subir versión:", error);
    res.status(500).json({ message: "Error al subir versión" });
  }
};

module.exports = {
  getMisTesis,
  registrarTesis,
  subirVersion,
};
