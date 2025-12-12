const pool = require("../config/database");

// 1. SUBIR PROYECTO
exports.subirProyecto = async (req, res) => {
  try {
    const { rol, id_estudiante } = req.user;

    if (rol !== "ESTUDIANTE")
      return res
        .status(403)
        .json({ message: "Solo estudiantes pueden subir proyecto" });

    if (!req.file)
      return res.status(400).json({ message: "Debe adjuntar un PDF" });

    const { titulo, resumen, id_especialidad } = req.body;

    const [result] = await pool.query(
      `INSERT INTO proyecto_tesis 
      (id_estudiante, id_especialidad, titulo, resumen, ruta_pdf) 
      VALUES (?, ?, ?, ?, ?)`,
      [id_estudiante, id_especialidad, titulo, resumen, req.file.filename]
    );

    res.json({
      message: "Proyecto subido correctamente",
      id_proyecto: result.insertId,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error servidor" });
  }
};

// 2. REVISIÓN DE FORMATO
exports.revisarFormato = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso restringido" });

    const { id_proyecto } = req.params;
    const { estado } = req.body;

    await pool.query(
      `UPDATE proyecto_tesis SET estado_proyecto=? WHERE id_proyecto=?`,
      [estado, id_proyecto]
    );

    res.json({ message: "Formato revisado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error servidor" });
  }
};

// 3. REVISIÓN DEL ASESOR
exports.revisionAsesor = async (req, res) => {
  try {
    if (req.user.rol !== "DOCENTE")
      return res.status(403).json({ message: "Solo asesores revisan" });

    const { id_docente } = req.user;
    const { id_proyecto } = req.params;
    const { estado_revision, comentarios } = req.body;

    await pool.query(
      `INSERT INTO revision_proyecto_asesor
      (id_proyecto, id_asesor, estado_revision, comentarios)
      VALUES (?, ?, ?, ?)`,
      [id_proyecto, id_docente, estado_revision, comentarios || null]
    );

    await pool.query(
      `UPDATE proyecto_tesis SET estado_proyecto='APROBADO_ASESOR'
       WHERE id_proyecto=?`,
      [id_proyecto]
    );

    res.json({ message: "Revisión del asesor registrada" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error servidor" });
  }
};

// 4. ASIGNAR JURADOS
exports.asignarJurados = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso restringido" });

    const { id_proyecto } = req.params;
    const { presidente, secretario, vocal } = req.body;

    const jurados = [presidente, secretario, vocal];
    if (new Set(jurados).size !== 3)
      return res.status(400).json({ message: "Jurados repetidos" });

    await pool.query(
      `INSERT INTO proyecto_jurado VALUES (?, ?, 'PRESIDENTE')`,
      [id_proyecto, presidente]
    );
    await pool.query(
      `INSERT INTO proyecto_jurado VALUES (?, ?, 'SECRETARIO')`,
      [id_proyecto, secretario]
    );
    await pool.query(`INSERT INTO proyecto_jurado VALUES (?, ?, 'VOCAL')`, [
      id_proyecto,
      vocal,
    ]);

    await pool.query(
      `UPDATE proyecto_tesis SET estado_proyecto='ASIGNADO_JURADOS'
       WHERE id_proyecto=?`,
      [id_proyecto]
    );

    res.json({ message: "Jurados asignados correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error servidor" });
  }
};

// 5. REVISIÓN DEL JURADO
exports.revisionJurado = async (req, res) => {
  try {
    if (req.user.rol !== "DOCENTE")
      return res.status(403).json({ message: "Acceso restringido" });

    const { id_docente } = req.user;
    const { id_proyecto } = req.params;
    const { estado_revision, comentarios } = req.body;

    await pool.query(
      `INSERT INTO revision_proyecto_jurado 
      (id_proyecto, id_jurado, estado_revision, comentarios)
      VALUES (?, ?, ?, ?)`,
      [id_proyecto, id_docente, estado_revision, comentarios || null]
    );

    res.json({ message: "Revisión del jurado registrada" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error servidor" });
  }
};

// 6. DICTAMEN FINAL
exports.dictamenFinal = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso restringido" });

    const { id_proyecto } = req.params;

    const [rev] = await pool.query(
      `SELECT estado_revision FROM revision_proyecto_jurado WHERE id_proyecto=?`,
      [id_proyecto]
    );

    const aprobados = rev.filter(
      (r) => r.estado_revision === "APROBADO"
    ).length;

    if (aprobados < 3)
      return res
        .status(400)
        .json({ message: "No todos los jurados aprobaron" });

    await pool.query(
      `UPDATE proyecto_tesis SET estado_proyecto='APROBADO_FINAL'
       WHERE id_proyecto=?`,
      [id_proyecto]
    );

    res.json({ message: "Proyecto aprobado completamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error servidor" });
  }
};

module.exports = {
  subirProyecto,
  revisarFormato,
  revisionAsesor,
  asignarJurados,
  revisionJurado,
  dictamenFinal,
};
