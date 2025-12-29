const pool = require("../config/database");
const { notificar } = require("../utils/notificar");

// =============================
// LISTADOS PENDIENTES
// =============================

// Asesores por aprobar
const pendientesAsesor = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT p.id_proyecto, p.titulo, d.id_docente,
        CONCAT(per.nombres,' ',per.apellido_paterno,' ',per.apellido_materno) AS asesor
      FROM proyecto_tesis p
      JOIN docente d ON d.id_docente = p.id_asesor
      JOIN persona per ON per.id_persona = d.id_persona
      WHERE p.estado_asesor = 'PROPUESTO'
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR pendientesAsesor:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// Proyectos para revisar formato
const pendientesFormato = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT id_proyecto, titulo, ruta_pdf
      FROM proyecto_tesis
      WHERE estado_proyecto IN ('PENDIENTE','OBSERVADO_FORMATO')
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR pendientesFormato:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// Proyectos listos para asignar jurados
const pendientesJurados = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT id_proyecto, titulo
      FROM proyecto_tesis
      WHERE estado_proyecto = 'APROBADO_ASESOR'
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR pendientesJurados:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// Proyectos listos para dictamen final
const pendientesDictamen = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT p.id_proyecto, p.titulo
      FROM proyecto_tesis p
      JOIN revision_proyecto_jurado r ON r.id_proyecto = p.id_proyecto
      GROUP BY p.id_proyecto
      HAVING SUM(r.estado_revision = 'APROBADO') = 3
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR pendientesDictamen:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// VALIDAR ASESOR (ETAPA 1)
// =============================
const validarAsesor = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo coordinación" });

    const { id_proyecto } = req.params;
    const { aprobado } = req.body;

    const [data] = await pool.query(
      `SELECT p.titulo, p.id_asesor, e.id_estudiante,
              perE.nombres AS enom, perE.apellido_paterno AS epat, perE.apellido_materno AS emat,
              perD.nombres AS dnom, perD.apellido_paterno AS dpat, perD.apellido_materno AS dmat
       FROM proyecto_tesis p
       JOIN estudiante e ON e.id_estudiante = p.id_estudiante
       JOIN persona perE ON perE.id_persona = e.id_persona
       JOIN docente d ON d.id_docente = p.id_asesor
       JOIN persona perD ON perD.id_persona = d.id_persona
       WHERE p.id_proyecto = ?`,
      [id_proyecto]
    );

    if (data.length === 0)
      return res.status(404).json({ message: "Proyecto no encontrado" });

    const titulo = data[0].titulo;
    const estudianteNombre = `${data[0].enom} ${data[0].epat} ${data[0].emat}`;
    const asesorNombre = `${data[0].dnom} ${data[0].dpat} ${data[0].dmat}`;

    // Usuario estudiante
    const [userEstu] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u JOIN estudiante e ON e.id_persona = u.id_persona
       WHERE e.id_estudiante = ?`,
      [data[0].id_estudiante]
    );

    // Usuario asesor
    const [userAsesor] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u JOIN docente d ON d.id_persona = u.id_persona
       WHERE d.id_docente = ?`,
      [data[0].id_asesor]
    );

    if (aprobado) {
      await pool.query(
        `UPDATE proyecto_tesis SET estado_asesor = 'APROBADO'
         WHERE id_proyecto = ?`,
        [id_proyecto]
      );

      await notificar(
        userEstu[0].id_usuario,
        "Asesor aprobado",
        `Tu asesor ${asesorNombre} fue aprobado para el proyecto "${titulo}".`
      );

      await notificar(
        userAsesor[0].id_usuario,
        "Asignación aprobada",
        `Has sido aprobado como asesor del proyecto "${titulo}".`
      );

      return res.json({ message: "Asesor aprobado" });
    }

    // RECHAZADO
    await pool.query(
      `UPDATE proyecto_tesis
       SET id_asesor=NULL, estado_asesor='RECHAZADO'
       WHERE id_proyecto=?`,
      [id_proyecto]
    );

    await notificar(
      userEstu[0].id_usuario,
      "Asesor rechazado",
      `La coordinación rechazó tu elección de asesor para "${titulo}".`
    );

    await notificar(
      userAsesor[0].id_usuario,
      "Asignación rechazada",
      `Se rechazó tu asignación como asesor del proyecto "${titulo}".`
    );

    res.json({ message: "Asesor rechazado" });
  } catch (err) {
    console.error("ERROR validarAsesor:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// REVISAR FORMATO (ETAPA 1)
// =============================
const revisarFormato = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo coordinación" });

    const { id_proyecto } = req.params;
    const { estado } = req.body;

    await pool.query(
      `UPDATE proyecto_tesis SET estado_proyecto=? WHERE id_proyecto=?`,
      [estado, id_proyecto]
    );

    // Obtener estudiante
    const [info] = await pool.query(
      `SELECT p.titulo, e.id_estudiante
       FROM proyecto_tesis p
       JOIN estudiante e ON e.id_estudiante = p.id_estudiante
       WHERE id_proyecto=?`,
      [id_proyecto]
    );

    const titulo = info[0].titulo;

    const [userEstu] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u JOIN estudiante e ON e.id_persona=u.id_persona
       WHERE e.id_estudiante=?`,
      [info[0].id_estudiante]
    );

    await notificar(
      userEstu[0].id_usuario,
      "Revisión de formato",
      `La coordinación revisó el formato de tu proyecto "${titulo}". Estado: ${estado}.`
    );

    res.json({ message: "Formato revisado" });
  } catch (err) {
    console.error("ERROR revisarFormato:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// ASIGNAR JURADOS (ETAPA 1)
// =============================
const asignarJurados = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo coordinación" });

    const { id_proyecto } = req.params;
    const { presidente, secretario, vocal } = req.body;

    const jurados = [presidente, secretario, vocal];

    if (new Set(jurados).size !== 3)
      return res
        .status(400)
        .json({ message: "Los jurados deben ser distintos" });

    // Obtener especialidad y asesor
    const [proy] = await pool.query(
      `SELECT id_especialidad, id_asesor
       FROM proyecto_tesis WHERE id_proyecto=?`,
      [id_proyecto]
    );

    if (proy.length === 0)
      return res.status(404).json({ message: "Proyecto no encontrado" });

    // VALIDAR: asesor no puede ser jurado
    if (jurados.includes(proy[0].id_asesor)) {
      return res.status(400).json({
        message: "El asesor no puede ser jurado del mismo proyecto",
      });
    }

    // Validar especialidad de cada jurado
    for (const j of jurados) {
      const [valid] = await pool.query(
        `SELECT * FROM docente_especialidad
         WHERE id_docente=? AND id_especialidad=?`,
        [j, proy[0].id_especialidad]
      );

      if (valid.length === 0)
        return res.status(400).json({
          message: `El docente ${j} no pertenece a la especialidad del proyecto`,
        });
    }

    // Registrar jurados
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
      `UPDATE proyecto_tesis
       SET estado_proyecto='ASIGNADO_JURADOS'
       WHERE id_proyecto=?`,
      [id_proyecto]
    );

    // Notificaciones
    const map = {
      [presidente]: "PRESIDENTE",
      [secretario]: "SECRETARIO",
      [vocal]: "VOCAL",
    };

    for (const j of jurados) {
      const [usr] = await pool.query(
        `SELECT u.id_usuario
         FROM usuario u
         JOIN docente d ON d.id_persona=u.id_persona
         WHERE d.id_docente=?`,
        [j]
      );

      await notificar(
        usr[0].id_usuario,
        "Designación como jurado",
        `Ha sido designado como ${map[j]} y debe revisar el proyecto.`
      );
    }

    res.json({ message: "Jurados asignados y notificados" });
  } catch (err) {
    console.error("ERROR asignarJurados:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// DICTAMEN FINAL (ETAPA 1)
// =============================
const dictamenFinal = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo coordinación" });

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
        .json({ message: "Aún falta aprobación de jurados" });

    // Actualizar proyecto
    await pool.query(
      `UPDATE proyecto_tesis
       SET estado_proyecto='APROBADO_FINAL'
       WHERE id_proyecto=?`,
      [id_proyecto]
    );

    const [info] = await pool.query(
      `SELECT p.titulo, e.id_estudiante
       FROM proyecto_tesis p
       JOIN estudiante e ON e.id_estudiante=p.id_estudiante
       WHERE p.id_proyecto=?`,
      [id_proyecto]
    );

    const titulo = info[0].titulo;

    const [usr] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u JOIN estudiante e ON e.id_persona=u.id_persona
       WHERE e.id_estudiante=?`,
      [info[0].id_estudiante]
    );

    await notificar(
      usr[0].id_usuario,
      "Proyecto aprobado",
      `Tu proyecto "${titulo}" ha sido aprobado por unanimidad.`
    );

    res.json({ message: "Proyecto aprobado" });
  } catch (err) {
    console.error("ERROR dictamenFinal:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// ETAPA 2 — VALIDACIÓN DE FORMATO DEL BORRADOR
// =============================
const validarFormatoBorrador = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso restringido" });

    const { id_borrador } = req.params;
    const { aprobado } = req.body;

    const estado = aprobado ? "APROBADO_CORD" : "OBSERVADO";

    await pool.query(`UPDATE tesis_borrador SET estado=? WHERE id_borrador=?`, [
      estado,
      id_borrador,
    ]);

    // Obtener estudiante
    const [info] = await pool.query(
      `SELECT b.id_proyecto, e.id_estudiante
       FROM tesis_borrador b
       JOIN proyecto_tesis p ON p.id_proyecto=b.id_proyecto
       JOIN estudiante e ON e.id_estudiante=p.id_estudiante
       WHERE b.id_borrador=?`,
      [id_borrador]
    );

    const [usr] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u JOIN estudiante e ON e.id_persona=u.id_persona
       WHERE e.id_estudiante=?`,
      [info[0].id_estudiante]
    );

    if (aprobado) {
      await notificar(
        usr[0].id_usuario,
        "Formato aprobado",
        "La coordinación aprobó el formato del borrador. Pasa a revisión del asesor."
      );
    } else {
      await notificar(
        usr[0].id_usuario,
        "Formato observado",
        "La coordinación observó el formato del borrador. Corrige y vuelve a subir."
      );
    }

    res.json({ message: "Formato de borrador revisado" });
  } catch (err) {
    console.error("ERROR validarFormatoBorrador:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// ENDPOINTS PARA DASHBOARD
// =============================

// GET proyectos pendientes (agregador para el dashboard)
const getProyectosPendientes = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT 
        p.id_proyecto,
        p.titulo,
        p.estado_proyecto,
        p.estado_asesor,
        CONCAT(pers.nombres, ' ', pers.apellido_paterno, ' ', pers.apellido_materno) AS nombre_estudiante
      FROM proyecto_tesis p
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona pers ON pers.id_persona = e.id_persona
      WHERE p.estado_proyecto IN ('PENDIENTE', 'OBSERVADO_FORMATO', 'PROPUESTO')
         OR p.estado_asesor = 'PROPUESTO'
      ORDER BY p.fecha_subida DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR getProyectosPendientes:", err);
    res.status(500).json({ message: "Error interno", error: err.message });
  }
};

// GET borradores pendientes
const getBorradoresPendientes = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT 
        b.id_borrador,
        b.numero_iteracion,
        b.estado,
        b.fecha_subida,
        p.titulo AS titulo_proyecto,
        p.id_proyecto,
        CONCAT(pers.nombres, ' ', pers.apellido_paterno, ' ', pers.apellido_materno) AS nombre_estudiante
      FROM tesis_borrador b
      JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona pers ON pers.id_persona = e.id_persona
      WHERE b.estado IN ('PENDIENTE', 'OBSERVADO')
      ORDER BY b.fecha_subida DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR getBorradoresPendientes:", err);
    res.status(500).json({ message: "Error interno", error: err.message });
  }
};

// GET sustentaciones programadas
const getSustentacionesProgramadas = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT 
        s.id_sustentacion,
        s.fecha_hora_sustentacion,
        s.lugar,
        s.nota,
        s.dictamen,
        p.titulo AS titulo_proyecto,
        p.id_proyecto,
        CONCAT(pers.nombres, ' ', pers.apellido_paterno, ' ', pers.apellido_materno) AS nombre_estudiante
      FROM sustentacion s
      JOIN proyecto_tesis p ON p.id_proyecto = s.id_proyecto
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona pers ON pers.id_persona = e.id_persona
      WHERE DATE(s.fecha_hora_sustentacion) >= CURDATE()
      ORDER BY s.fecha_hora_sustentacion ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR getSustentacionesProgramadas:", err);
    res.status(500).json({ message: "Error interno", error: err.message });
  }
};

module.exports = {
  pendientesAsesor,
  pendientesFormato,
  pendientesJurados,
  pendientesDictamen,
  validarAsesor,
  revisarFormato,
  asignarJurados,
  dictamenFinal,
  validarFormatoBorrador,
  getProyectosPendientes,
  getBorradoresPendientes,
  getSustentacionesProgramadas,
};
