const pool = require("../config/database");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { notificar } = require("../utils/notificar");
const logger = require("../config/logger");
const { withTransaction } = require("../utils/transaction");

// =============================
// Helpers
// =============================
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

/**
 * Genera número de resolución único con protección contra race conditions
 * Usa SELECT FOR UPDATE para bloquear la fila y evitar duplicados
 */
const generarNumeroResolucion = async () => {
  const anio = new Date().getFullYear();

  return await withTransaction(pool, async (connection) => {
    // Obtener el último número con lock exclusivo (SELECT FOR UPDATE)
    const [rows] = await connection.query(
      `SELECT COUNT(*) total FROM resolucion WHERE YEAR(fecha_resolucion)=? FOR UPDATE`,
      [anio]
    );

    const correlativo = String(rows[0].total + 1).padStart(3, "0");
    const numeroResolucion = `${correlativo}-${anio}-FISeIC-UNU`;

    logger.info(`Generando Resolución: ${numeroResolucion}`);
    return numeroResolucion;
  });
};

/* ===============================
   LISTAR TESIS FINALES
================================ */
const listarTesisFinales = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION") {
      return res.status(403).json({ message: "Acceso restringido" });
    }

    const [tesis] = await pool.query(
      `SELECT 
        t.id_tesis,
        t.id_proyecto,
        t.ruta_pdf,
        t.fecha_registro,
        t.estado AS estado_tesis,
        p.titulo,
        CONCAT(per.nombres, ' ', per.apellido_paterno, ' ', per.apellido_materno) AS estudiante,
        e.codigo_estudiante AS codigo,
        r.id_resolucion,
        r.numero_resolucion,
        r.ruta_pdf AS ruta_resolucion,
        s.id_sustentacion,
        s.fecha_hora AS fecha_sustentacion,
        s.estado AS estado_sustentacion,
        s.nota,
        s.dictamen,
        a.id_acta,
        a.ruta_pdf AS ruta_acta
       FROM tesis t
       JOIN proyecto_tesis p ON p.id_proyecto = t.id_proyecto
       JOIN estudiante e ON e.id_estudiante = p.id_estudiante
       JOIN persona per ON per.id_persona = e.id_persona
       LEFT JOIN resolucion r ON r.id_proyecto = t.id_proyecto
       LEFT JOIN sustentacion s ON s.id_proyecto = t.id_proyecto
       LEFT JOIN acta_sustentacion a ON a.id_sustentacion = s.id_sustentacion
       ORDER BY t.fecha_registro DESC`
    );

    res.json(tesis);
  } catch (err) {
    console.error("ERROR listarTesisFinales:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

/* ===============================
   GENERAR RESOLUCIÓN
================================ */
const generarResolucion = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION") {
      return res.status(403).json({ message: "Acceso restringido" });
    }

    const { id_proyecto } = req.params;

    /* 1️⃣ Verificar tesis final */
    const [tesis] = await pool.query(
      `SELECT * FROM tesis WHERE id_proyecto=?`,
      [id_proyecto]
    );

    if (!tesis.length) {
      return res
        .status(400)
        .json({ message: "No existe tesis final registrada" });
    }

    /* 2️⃣ Evitar doble resolución */
    const [existente] = await pool.query(
      `SELECT id_resolucion FROM resolucion WHERE id_proyecto=?`,
      [id_proyecto]
    );

    if (existente.length) {
      return res
        .status(400)
        .json({ message: "Este proyecto ya tiene resolución" });
    }

    /* 3️⃣ Datos del proyecto */
    const [data] = await pool.query(
      `
      SELECT 
        p.titulo,
        e.codigo_estudiante AS codigo,
        perE.nombres,
        perE.apellido_paterno,
        perE.apellido_materno,
        perE.numero_documento AS dni,
        d.id_docente,
        CONCAT(perD.nombres,' ',perD.apellido_paterno,' ',perD.apellido_materno) AS asesor
      FROM proyecto_tesis p
      JOIN estudiante e ON e.id_estudiante=p.id_estudiante
      JOIN persona perE ON perE.id_persona=e.id_persona
      JOIN docente d ON d.id_docente=p.id_asesor
      JOIN persona perD ON perD.id_persona=d.id_persona
      WHERE p.id_proyecto=?
      `,
      [id_proyecto]
    );

    const estudiante = `${data[0].nombres} ${data[0].apellido_paterno} ${data[0].apellido_materno}`;

    /* 4️⃣ Jurados */
    const [jurados] = await pool.query(
      `
      SELECT pj.rol_jurado,
             CONCAT(per.nombres,' ',per.apellido_paterno,' ',per.apellido_materno) nombre
      FROM proyecto_jurado pj
      JOIN docente d ON d.id_docente=pj.id_jurado
      JOIN persona per ON per.id_persona=d.id_persona
      WHERE pj.id_proyecto=?
      `,
      [id_proyecto]
    );

    const presidente = jurados.find(
      (j) => j.rol_jurado === "PRESIDENTE"
    )?.nombre;
    const secretario = jurados.find(
      (j) => j.rol_jurado === "SECRETARIO"
    )?.nombre;
    const vocal = jurados.find((j) => j.rol_jurado === "VOCAL")?.nombre;

    /* 5️⃣ Número resolución */
    const numeroResolucion = await generarNumeroResolucion();

    /* 6️⃣ HTML */
    const template = fs.readFileSync(
      path.join(__dirname, "../templates/resolucion.html"),
      "utf8"
    );

    const html = template
      .replace(/{{NUMERO_RESOLUCION}}/g, numeroResolucion)
      .replace(/{{FECHA}}/g, new Date().toLocaleDateString("es-PE"))
      .replace(/{{NOMBRE_COMPLETO_ESTUDIANTE}}/g, estudiante)
      .replace(/{{DNI_ESTUDIANTE}}/g, data[0].dni)
      .replace(/{{CODIGO_ESTUDIANTE}}/g, data[0].codigo)
      .replace(/{{TITULO_TESIS}}/g, data[0].titulo)
      .replace(/{{NOMBRE_ASESOR}}/g, data[0].asesor)
      .replace(/{{PRESIDENTE}}/g, presidente)
      .replace(/{{SECRETARIO}}/g, secretario)
      .replace(/{{VOCAL}}/g, vocal);

    /* 7️⃣ PDF */
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const nombrePDF = `resolucion_${numeroResolucion}.pdf`;
    const rutaPDF = path.join(__dirname, "../uploads/resoluciones", nombrePDF);

    await page.pdf({ path: rutaPDF, format: "A4" });
    await browser.close();

    /* 8️⃣ Guardar en BD */
    await pool.query(
      `
      INSERT INTO resolucion
      (id_proyecto, numero_resolucion, fecha_resolucion, ruta_pdf)
      VALUES (?, ?, CURDATE(), ?)
      `,
      [id_proyecto, numeroResolucion, nombrePDF]
    );

    /* 9️⃣ Notificar estudiante */
    const [userEst] = await pool.query(
      `
      SELECT u.id_usuario
      FROM usuario u
      JOIN estudiante e ON e.id_persona=u.id_persona
      WHERE e.id_estudiante=?
      `,
      [tesis[0].id_estudiante]
    );

    if (userEst.length) {
      await notificar(
        userEst[0].id_usuario,
        "Resolución de sustentación",
        `Se generó la resolución ${numeroResolucion} para tu tesis.`
      );
    }

    res.json({
      message: "Resolución generada correctamente",
      numero_resolucion: numeroResolucion,
      archivo: nombrePDF,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno" });
  }
};

/* ===============================
   DESCARGAR RESOLUCIÓN
================================ */
const descargarResolucion = async (req, res) => {
  const [r] = await pool.query(
    `SELECT ruta_pdf FROM resolucion WHERE id_resolucion=?`,
    [req.params.id_resolucion]
  );

  if (!r.length) return res.sendStatus(404);

  const filePath = path.join(
    __dirname,
    "../uploads/resoluciones",
    r[0].ruta_pdf
  );

  res.download(filePath);
};

const formatearFechaHoraPE = (dt) => {
  // dt viene como Date
  return dt.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Genera número de acta único con protección contra race conditions
 * Usa SELECT FOR UPDATE para bloquear la fila y evitar duplicados
 */
const generarNumeroActa = async () => {
  const anio = new Date().getFullYear();

  return await withTransaction(pool, async (connection) => {
    // Obtener el último número con lock exclusivo (SELECT FOR UPDATE)
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS total FROM acta_sustentacion a
       JOIN sustentacion s ON s.id_sustentacion=a.id_sustentacion
       WHERE YEAR(s.fecha_registro)=?
       FOR UPDATE`,
      [anio]
    );

    const correlativo = String(rows[0].total + 1).padStart(3, "0");
    const numeroActa = `${correlativo}-${anio}-FISeIC`;

    logger.debug(`Número de acta generado: ${numeroActa}`, {
      anio,
      correlativo,
    });

    return numeroActa;
  });
};

// Obtiene id_usuario del estudiante del proyecto
const getUsuarioEstudianteByProyecto = async (id_proyecto) => {
  const [rows] = await pool.query(
    `
    SELECT u.id_usuario
    FROM proyecto_tesis p
    JOIN estudiante e ON e.id_estudiante=p.id_estudiante
    JOIN usuario u ON u.id_persona=e.id_persona
    WHERE p.id_proyecto=?
    `,
    [id_proyecto]
  );
  return rows.length ? rows[0].id_usuario : null;
};

// Obtiene id_usuario del asesor del proyecto
const getUsuarioAsesorByProyecto = async (id_proyecto) => {
  const [rows] = await pool.query(
    `
    SELECT u.id_usuario
    FROM proyecto_tesis p
    JOIN docente d ON d.id_docente=p.id_asesor
    JOIN usuario u ON u.id_persona=d.id_persona
    WHERE p.id_proyecto=?
    `,
    [id_proyecto]
  );
  return rows.length ? rows[0].id_usuario : null;
};

// Obtiene id_usuario de jurados del proyecto (array)
const getUsuariosJuradosByProyecto = async (id_proyecto) => {
  const [rows] = await pool.query(
    `
    SELECT u.id_usuario, pj.rol_jurado
    FROM proyecto_jurado pj
    JOIN docente d ON d.id_docente=pj.id_jurado
    JOIN usuario u ON u.id_persona=d.id_persona
    WHERE pj.id_proyecto=?
    `,
    [id_proyecto]
  );
  return rows; // [{id_usuario, rol_jurado}]
};

// =============================
// 1) Programar sustentación
// =============================
const programarSustentacion = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION") {
      return res.status(403).json({ message: "Acceso solo para coordinación" });
    }

    const { id_proyecto } = req.params;
    const { fecha_hora, modalidad, lugar } = req.body;

    if (!fecha_hora) {
      return res.status(400).json({ message: "Debe enviar fecha_hora" });
    }

    // 1) Validar que exista tesis final (tu regla)
    const [t] = await pool.query(
      `SELECT id_tesis FROM tesis WHERE id_proyecto=?`,
      [id_proyecto]
    );
    if (!t.length) {
      return res.status(400).json({
        message: "No existe tesis final registrada para este proyecto",
      });
    }

    // 2) Validar que el proyecto tenga jurados y asesor asignados
    const [p] = await pool.query(
      `SELECT titulo, id_asesor FROM proyecto_tesis WHERE id_proyecto=?`,
      [id_proyecto]
    );
    if (!p.length)
      return res.status(404).json({ message: "Proyecto no existe" });
    if (!p[0].id_asesor) {
      return res
        .status(400)
        .json({ message: "El proyecto aún no tiene asesor" });
    }

    const [jur] = await pool.query(
      `SELECT COUNT(*) AS total FROM proyecto_jurado WHERE id_proyecto=?`,
      [id_proyecto]
    );
    if (jur[0].total < 3) {
      return res
        .status(400)
        .json({ message: "Faltan jurados para este proyecto" });
    }

    // 3) Evitar doble programación (1 sustentación activa por proyecto)
    const [ex] = await pool.query(
      `SELECT id_sustentacion, estado FROM sustentacion WHERE id_proyecto=?`,
      [id_proyecto]
    );
    if (ex.length && ex[0].estado !== "CANCELADA") {
      return res.status(400).json({
        message: "Este proyecto ya tiene una sustentación registrada",
      });
    }

    // 4) Guardar sustentación
    const [ins] = await pool.query(
      `
      INSERT INTO sustentacion (id_proyecto, fecha_hora, modalidad, lugar, estado)
      VALUES (?, ?, ?, ?, 'PROGRAMADA')
      `,
      [id_proyecto, fecha_hora, modalidad || "PRESENCIAL", lugar || null]
    );

    const id_sustentacion = ins.insertId;
    const titulo = p[0].titulo;

    // 5) Notificaciones oficiales
    const usuarioEst = await getUsuarioEstudianteByProyecto(id_proyecto);
    const usuarioAsesor = await getUsuarioAsesorByProyecto(id_proyecto);
    const usuariosJur = await getUsuariosJuradosByProyecto(id_proyecto);

    const dt = new Date(fecha_hora);
    const fechaTxt = formatearFechaHoraPE(dt);
    const modTxt = modalidad || "PRESENCIAL";
    const lugarTxt = lugar || "(no especificado)";

    if (usuarioEst) {
      await notificar(
        usuarioEst,
        "Sustentación programada",
        `Tu sustentación fue programada para ${fechaTxt}. Modalidad: ${modTxt}. Lugar: ${lugarTxt}. Tesis: "${titulo}".`
      );
    }

    if (usuarioAsesor) {
      await notificar(
        usuarioAsesor,
        "Sustentación programada",
        `Se programó la sustentación del proyecto "${titulo}" para ${fechaTxt}. Modalidad: ${modTxt}. Lugar: ${lugarTxt}.`
      );
    }

    for (const j of usuariosJur) {
      await notificar(
        j.id_usuario,
        "Sustentación programada",
        `Se programó la sustentación del proyecto "${titulo}" para ${fechaTxt}. Modalidad: ${modTxt}. Lugar: ${lugarTxt}. Cargo: ${j.rol_jurado}.`
      );
    }

    res.json({
      message: "Sustentación programada y notificada",
      id_sustentacion,
    });
  } catch (err) {
    console.error("ERROR programarSustentacion:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// 2) Registrar resultado (nota/dictamen)
// =============================
const registrarResultado = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION") {
      return res.status(403).json({ message: "Acceso solo para coordinación" });
    }

    const { id_sustentacion } = req.params;
    const { nota, dictamen, observaciones } = req.body;

    if (!dictamen || !["APROBADO", "DESAPROBADO"].includes(dictamen)) {
      return res
        .status(400)
        .json({ message: "dictamen debe ser APROBADO o DESAPROBADO" });
    }

    const [s] = await pool.query(
      `SELECT id_proyecto, estado FROM sustentacion WHERE id_sustentacion=?`,
      [id_sustentacion]
    );
    if (!s.length)
      return res.status(404).json({ message: "Sustentación no existe" });
    if (s[0].estado === "CANCELADA") {
      return res.status(400).json({
        message: "Sustentación cancelada no puede registrar resultado",
      });
    }

    await pool.query(
      `
      UPDATE sustentacion
      SET estado='SUSTENTADA', nota=?, dictamen=?, observaciones=?
      WHERE id_sustentacion=?
      `,
      [nota ?? null, dictamen, observaciones ?? null, id_sustentacion]
    );

    // Si aprueba, marca tesis como SUSTENTADA (opcional pero recomendado)
    if (dictamen === "APROBADO") {
      await pool.query(
        `
        UPDATE tesis t
        JOIN sustentacion s ON s.id_proyecto=t.id_proyecto
        SET t.estado='SUSTENTADA'
        WHERE s.id_sustentacion=?
        `,
        [id_sustentacion]
      );
    }

    res.json({ message: "Resultado registrado (SUSTENTADA)" });
  } catch (err) {
    console.error("ERROR registrarResultado:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// 3) Generar Acta PDF
//   Requiere: sustentación en estado SUSTENTADA
// =============================
const generarActaPDF = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION") {
      return res.status(403).json({ message: "Acceso solo para coordinación" });
    }

    const { id_sustentacion } = req.params;

    // 1) Validar sustentación
    const [s] = await pool.query(
      `SELECT id_proyecto, fecha_hora, modalidad, lugar, estado, nota, dictamen, observaciones
       FROM sustentacion WHERE id_sustentacion=?`,
      [id_sustentacion]
    );
    if (!s.length)
      return res.status(404).json({ message: "Sustentación no existe" });

    if (s[0].estado !== "SUSTENTADA") {
      return res.status(400).json({
        message:
          "Solo se puede generar acta cuando la sustentación esté en estado SUSTENTADA",
      });
    }

    const id_proyecto = s[0].id_proyecto;

    // 2) Evitar doble acta
    const [ex] = await pool.query(
      `SELECT id_acta FROM acta_sustentacion WHERE id_sustentacion=?`,
      [id_sustentacion]
    );
    if (ex.length) {
      return res
        .status(400)
        .json({ message: "Esta sustentación ya tiene acta generada" });
    }

    // 3) Traer datos completos (estudiante, asesor, jurado, título)
    const [data] = await pool.query(
      `
      SELECT 
        p.titulo,
        e.codigo_estudiante AS codigo,
        perE.numero_documento AS dni,
        perE.nombres,
        perE.apellido_paterno,
        perE.apellido_materno,
        CONCAT(perD.nombres,' ',perD.apellido_paterno,' ',perD.apellido_materno) AS asesor
      FROM proyecto_tesis p
      JOIN estudiante e ON e.id_estudiante=p.id_estudiante
      JOIN persona perE ON perE.id_persona=e.id_persona
      JOIN docente d ON d.id_docente=p.id_asesor
      JOIN persona perD ON perD.id_persona=d.id_persona
      WHERE p.id_proyecto=?
      `,
      [id_proyecto]
    );
    if (!data.length)
      return res
        .status(400)
        .json({ message: "Datos del proyecto incompletos" });

    const estudiante = `${data[0].nombres} ${data[0].apellido_paterno} ${data[0].apellido_materno}`;

    const [jurados] = await pool.query(
      `
      SELECT pj.rol_jurado,
             CONCAT(per.nombres,' ',per.apellido_paterno,' ',per.apellido_materno) AS nombre
      FROM proyecto_jurado pj
      JOIN docente d ON d.id_docente=pj.id_jurado
      JOIN persona per ON per.id_persona=d.id_persona
      WHERE pj.id_proyecto=?
      `,
      [id_proyecto]
    );

    const presidente =
      jurados.find((j) => j.rol_jurado === "PRESIDENTE")?.nombre ||
      "(Sin presidente)";
    const secretario =
      jurados.find((j) => j.rol_jurado === "SECRETARIO")?.nombre ||
      "(Sin secretario)";
    const vocal =
      jurados.find((j) => j.rol_jurado === "VOCAL")?.nombre || "(Sin vocal)";

    // 4) N° acta
    const numeroActa = await generarNumeroActa();

    // 5) HTML con placeholders
    const template = fs.readFileSync(
      path.join(__dirname, "../templates/acta_sustentacion.html"),
      "utf8"
    );

    const dt = new Date(s[0].fecha_hora);
    const html = template
      .replace(/{{NUMERO_ACTA}}/g, numeroActa)
      .replace(/{{NOMBRE_COMPLETO_ESTUDIANTE}}/g, estudiante)
      .replace(/{{DNI_ESTUDIANTE}}/g, data[0].dni)
      .replace(/{{CODIGO_ESTUDIANTE}}/g, data[0].codigo)
      .replace(/{{TITULO_TESIS}}/g, data[0].titulo)
      .replace(/{{NOMBRE_ASESOR}}/g, data[0].asesor)
      .replace(/{{FECHA_HORA}}/g, formatearFechaHoraPE(dt))
      .replace(/{{MODALIDAD}}/g, s[0].modalidad)
      .replace(/{{LUGAR}}/g, s[0].lugar || "(no especificado)")
      .replace(/{{PRESIDENTE}}/g, presidente)
      .replace(/{{SECRETARIO}}/g, secretario)
      .replace(/{{VOCAL}}/g, vocal)
      .replace(/{{DICTAMEN}}/g, s[0].dictamen || "-")
      .replace(/{{NOTA}}/g, s[0].nota != null ? String(s[0].nota) : "-")
      .replace(/{{OBSERVACIONES}}/g, s[0].observaciones || "-");

    // 6) PDF
    const outDir = path.join(__dirname, "../uploads/actas");
    ensureDir(outDir);

    const nombrePDF = `acta_${numeroActa}.pdf`;
    const rutaPDF = path.join(outDir, nombrePDF);

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({ path: rutaPDF, format: "A4" });
    await browser.close();

    // 7) Guardar en BD
    await pool.query(
      `INSERT INTO acta_sustentacion (id_sustentacion, ruta_pdf) VALUES (?, ?)`,
      [id_sustentacion, nombrePDF]
    );

    // 8) Notificar a TODOS
    const usuarioEst = await getUsuarioEstudianteByProyecto(id_proyecto);
    const usuarioAsesor = await getUsuarioAsesorByProyecto(id_proyecto);
    const usuariosJur = await getUsuariosJuradosByProyecto(id_proyecto);

    if (usuarioEst) {
      await notificar(
        usuarioEst,
        "Acta de sustentación generada",
        `Se generó el Acta ${numeroActa} para tu tesis. Dictamen: ${s[0].dictamen}.`
      );
    }
    if (usuarioAsesor) {
      await notificar(
        usuarioAsesor,
        "Acta de sustentación generada",
        `Se generó el Acta ${numeroActa} del proyecto "${data[0].titulo}". Dictamen: ${s[0].dictamen}.`
      );
    }
    for (const j of usuariosJur) {
      await notificar(
        j.id_usuario,
        "Acta de sustentación generada",
        `Se generó el Acta ${numeroActa}. Dictamen: ${s[0].dictamen}.`
      );
    }

    res.json({
      message: "Acta generada correctamente",
      numero_acta: numeroActa,
      archivo: nombrePDF,
    });
  } catch (err) {
    console.error("ERROR generarActaPDF:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

// =============================
// 4) Descargar Acta
// =============================
const descargarActa = async (req, res) => {
  try {
    const { id_acta } = req.params;

    const [a] = await pool.query(
      `SELECT ruta_pdf FROM acta_sustentacion WHERE id_acta=?`,
      [id_acta]
    );
    if (!a.length) return res.sendStatus(404);

    const filePath = path.join(__dirname, "../uploads/actas", a[0].ruta_pdf);
    return res.download(filePath);
  } catch (err) {
    console.error("ERROR descargarActa:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

module.exports = {
  listarTesisFinales,
  generarResolucion,
  descargarResolucion,
  programarSustentacion,
  registrarResultado,
  generarActaPDF,
  descargarActa,
};
