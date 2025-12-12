const pool = require("../config/database");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { notificar } = require("../utils/notificar");

/* ===============================
   GENERAR NÚMERO DE RESOLUCIÓN
================================ */
const generarNumeroResolucion = async () => {
  const anio = new Date().getFullYear();
  const [rows] = await pool.query(
    `SELECT COUNT(*) total FROM resolucion WHERE YEAR(fecha_resolucion)=?`,
    [anio]
  );

  const correlativo = String(rows[0].total + 1).padStart(3, "0");
  return `${correlativo}-${anio}-FISeIC-UNU`;
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
        e.codigo,
        perE.nombres,
        perE.apellido_paterno,
        perE.apellido_materno,
        perE.dni,
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

module.exports = {
  generarResolucion,
  descargarResolucion,
};
