const pool = require("../config/database");
const { notificar } = require("../utils/notificar");

const getProyectosAprobadosJurados = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT 
        p.id_proyecto,
        p.titulo,
        p.resumen,
        p.fecha_subida,
        p.estado_proyecto,
        CONCAT(pers.nombres, ' ', pers.apellido_paterno, ' ', pers.apellido_materno) AS nombre_estudiante,
        e.codigo_estudiante,
        CONCAT(perAsesor.nombres, ' ', perAsesor.apellido_paterno, ' ', perAsesor.apellido_materno) AS nombre_asesor
      FROM proyecto_tesis p
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona pers ON pers.id_persona = e.id_persona
      LEFT JOIN docente d ON d.id_docente = p.id_asesor
      LEFT JOIN persona perAsesor ON perAsesor.id_persona = d.id_persona
      WHERE p.estado_proyecto = 'APROBADO_JURADOS'
      ORDER BY p.fecha_subida DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR getProyectosAprobadosJurados:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

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

    const [userEstu] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u JOIN estudiante e ON e.id_persona = u.id_persona
       WHERE e.id_estudiante = ?`,
      [data[0].id_estudiante]
    );

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

const revisarFormato = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo coordinación" });

    const { id_proyecto } = req.params;
    const { aprobado, motivo } = req.body;

    const nuevoEstado = aprobado ? "REVISADO_FORMATO" : "OBSERVADO_FORMATO";

    await pool.query(
      `UPDATE proyecto_tesis SET estado_proyecto=? WHERE id_proyecto=?`,
      [nuevoEstado, id_proyecto]
    );

    const [info] = await pool.query(
      `SELECT p.titulo, p.iteracion, e.id_estudiante
       FROM proyecto_tesis p
       JOIN estudiante e ON e.id_estudiante = p.id_estudiante
       WHERE id_proyecto=?`,
      [id_proyecto]
    );

    const titulo = info[0].titulo;
    const iteracion = info[0].iteracion;

    const [userEstu] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u JOIN estudiante e ON e.id_persona=u.id_persona
       WHERE e.id_estudiante=?`,
      [info[0].id_estudiante]
    );

    if (aprobado) {
      await notificar(
        userEstu[0].id_usuario,
        "Proyecto aprobado",
        `Tu proyecto "${titulo}" (Iteración ${iteracion}) fue aprobado por la coordinación. ¡Felicidades!`
      );
    } else {
      const mensajeRechazo = motivo
        ? `Tu proyecto "${titulo}" (Iteración ${iteracion}) fue observado por la coordinación. Motivo: ${motivo}. Por favor, corrige y vuelve a subir.`
        : `Tu proyecto "${titulo}" (Iteración ${iteracion}) fue observado por la coordinación. Por favor, corrige el formato y vuelve a subir.`;

      await notificar(
        userEstu[0].id_usuario,
        "Proyecto observado",
        mensajeRechazo
      );
    }

    res.json({ message: "Formato revisado", nuevoEstado });
  } catch (err) {
    console.error("ERROR revisarFormato:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

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

    const [proy] = await pool.query(
      `SELECT id_especialidad, id_asesor
       FROM proyecto_tesis WHERE id_proyecto=?`,
      [id_proyecto]
    );

    if (proy.length === 0)
      return res.status(404).json({ message: "Proyecto no encontrado" });

    if (jurados.includes(proy[0].id_asesor)) {
      return res.status(400).json({
        message: "El asesor no puede ser jurado del mismo proyecto",
      });
    }

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

const dictamenFinal = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo coordinación" });

    const { id_proyecto } = req.params;

    const [proyecto] = await pool.query(
      `SELECT estado_proyecto FROM proyecto_tesis WHERE id_proyecto=?`,
      [id_proyecto]
    );

    if (proyecto.length === 0)
      return res.status(404).json({ message: "Proyecto no encontrado" });

    if (proyecto[0].estado_proyecto !== "APROBADO_JURADOS")
      return res.status(400).json({
        message: "El proyecto debe estar aprobado por los jurados primero",
      });

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
      "Proyecto aprobado - Puede subir borrador de tesis",
      `¡Felicitaciones! Tu proyecto "${titulo}" ha sido aprobado por los jurados. Ahora puedes proceder a subir el borrador de tu tesis para revisión.`
    );

    const [asesorInfo] = await pool.query(
      `SELECT p.id_asesor
       FROM proyecto_tesis p
       WHERE p.id_proyecto=?`,
      [id_proyecto]
    );

    if (asesorInfo.length > 0 && asesorInfo[0].id_asesor) {
      const [usrAsesor] = await pool.query(
        `SELECT u.id_usuario
         FROM usuario u JOIN docente d ON d.id_persona=u.id_persona
         WHERE d.id_docente=?`,
        [asesorInfo[0].id_asesor]
      );

      if (usrAsesor.length > 0) {
        await notificar(
          usrAsesor[0].id_usuario,
          "Proyecto aprobado - Borrador próximo",
          `El proyecto "${titulo}" ha sido aprobado por los jurados. El estudiante procederá a enviar el borrador de tesis para tu revisión.`
        );
      }
    }

    res.json({ message: "Proyecto aprobado" });
  } catch (err) {
    console.error("ERROR dictamenFinal:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

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

const dictamenFinalBorrador = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo coordinación" });

    const { id_borrador } = req.params;

    const [borrador] = await pool.query(
      `SELECT estado, id_proyecto FROM tesis_borrador WHERE id_borrador=?`,
      [id_borrador]
    );

    if (borrador.length === 0)
      return res.status(404).json({ message: "Borrador no encontrado" });

    if (borrador[0].estado !== "APROBADO_JURADOS")
      return res.status(400).json({
        message: "El borrador debe estar aprobado por los jurados primero",
      });

    await pool.query(
      `UPDATE tesis_borrador
       SET estado='APROBADO_FINAL'
       WHERE id_borrador=?`,
      [id_borrador]
    );

    const [info] = await pool.query(
      `SELECT p.titulo, p.id_asesor, e.id_estudiante
       FROM tesis_borrador b
       JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
       JOIN estudiante e ON e.id_estudiante = p.id_estudiante
       WHERE b.id_borrador=?`,
      [id_borrador]
    );

    const { titulo, id_asesor, id_estudiante } = info[0];

    const [usr] = await pool.query(
      `SELECT u.id_usuario
       FROM usuario u JOIN estudiante e ON e.id_persona=u.id_persona
       WHERE e.id_estudiante=?`,
      [id_estudiante]
    );

    await notificar(
      usr[0].id_usuario,
      "Borrador aprobado - Listo para sustentación",
      `¡Felicitaciones! El borrador de tu tesis "${titulo}" ha sido aprobado por la coordinación. Se procedera con la programación de la sustentación.`
    );

    if (id_asesor) {
      const [usrAsesor] = await pool.query(
        `SELECT u.id_usuario
         FROM usuario u JOIN docente d ON d.id_persona=u.id_persona
         WHERE d.id_docente=?`,
        [id_asesor]
      );

      if (usrAsesor.length > 0) {
        await notificar(
          usrAsesor[0].id_usuario,
          "Borrador aprobado - Sustentación próxima",
          `El borrador de la tesis "${titulo}\" ha sido aprobado. El coordinador procedera con la programación de la sustentación.`
        );
      }
    }

    res.json({ message: "Borrador aprobado para sustentación" });
  } catch (err) {
    console.error("ERROR dictamenFinalBorrador:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

const getBorradoresAprobadosJurados = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT 
        b.id_borrador,
        b.numero_iteracion,
        b.fecha_subida,
        b.ruta_pdf,
        b.estado,
        p.id_proyecto,
        p.titulo,
        CONCAT(pers.nombres, ' ', pers.apellido_paterno, ' ', pers.apellido_materno) AS nombre_estudiante,
        e.codigo_estudiante,
        CONCAT(perAsesor.nombres, ' ', perAsesor.apellido_paterno, ' ', perAsesor.apellido_materno) AS nombre_asesor
      FROM tesis_borrador b
      JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona pers ON pers.id_persona = e.id_persona
      LEFT JOIN docente d ON d.id_docente = p.id_asesor
      LEFT JOIN persona perAsesor ON perAsesor.id_persona = d.id_persona
      WHERE b.estado = 'APROBADO_JURADOS'
      ORDER BY b.fecha_subida DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR getBorradoresAprobadosJurados:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

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
        p.id_especialidad,
        p.id_asesor,
        esp.nombre AS especialidad_nombre,
        CONCAT(pers.nombres, ' ', pers.apellido_paterno, ' ', pers.apellido_materno) AS nombre_estudiante,
        CONCAT(pers_asesor.nombres, ' ', pers_asesor.apellido_paterno, ' ', pers_asesor.apellido_materno) AS nombre_asesor,
        pers_asesor.correo AS email_asesor
      FROM proyecto_tesis p
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona pers ON pers.id_persona = e.id_persona
      LEFT JOIN especialidad esp ON esp.id_especialidad = p.id_especialidad
      LEFT JOIN docente d ON d.id_docente = p.id_asesor
      LEFT JOIN persona pers_asesor ON pers_asesor.id_persona = d.id_persona
      WHERE p.estado_proyecto IN ('PENDIENTE', 'OBSERVADO_FORMATO', 'PROPUESTO', 'APROBADO_ASESOR')
         OR p.estado_asesor = 'PROPUESTO'
      ORDER BY p.fecha_subida DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR getProyectosPendientes:", err);
    res.status(500).json({ message: "Error interno", error: err.message });
  }
};

const getBorradoresPendientes = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT 
        b.id_borrador,
        b.numero_iteracion,
        b.estado,
        b.ruta_pdf,
        b.fecha_subida,
        p.titulo,
        p.id_proyecto,
        CONCAT(pers.nombres, ' ', pers.apellido_paterno, ' ', pers.apellido_materno) AS nombre_estudiante,
        e.codigo_estudiante
      FROM tesis_borrador b
      JOIN proyecto_tesis p ON p.id_proyecto = b.id_proyecto
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona pers ON pers.id_persona = e.id_persona
      WHERE b.estado IN ('PENDIENTE')
      ORDER BY b.fecha_subida DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR getBorradoresPendientes:", err);
    res.status(500).json({ message: "Error interno", error: err.message });
  }
};

const getSustentacionesProgramadas = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const [rows] = await pool.query(`
      SELECT 
        s.id_sustentacion,
        s.fecha_hora,
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
      WHERE DATE(s.fecha_hora) >= CURDATE()
      ORDER BY s.fecha_hora ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("ERROR getSustentacionesProgramadas:", err);
    res.status(500).json({ message: "Error interno", error: err.message });
  }
};

const getProyectoDetalles = async (req, res) => {
  try {
    if (req.user.rol !== "COORDINACION")
      return res.status(403).json({ message: "Acceso solo para coordinación" });

    const { id_proyecto } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        p.id_proyecto,
        p.titulo,
        p.resumen,
        p.ruta_pdf,
        p.iteracion,
        p.estado_proyecto,
        p.estado_asesor,
        p.fecha_subida,
        p.id_especialidad,
        esp.nombre AS especialidad_nombre,
        CONCAT(perEst.nombres, ' ', perEst.apellido_paterno, ' ', perEst.apellido_materno) AS nombre_estudiante,
        perEst.correo AS email_estudiante,
        CONCAT(perAse.nombres, ' ', perAse.apellido_paterno, ' ', perAse.apellido_materno) AS nombre_asesor,
        perAse.correo AS email_asesor,
        p.id_asesor
      FROM proyecto_tesis p
      JOIN estudiante e ON e.id_estudiante = p.id_estudiante
      JOIN persona perEst ON perEst.id_persona = e.id_persona
      LEFT JOIN especialidad esp ON esp.id_especialidad = p.id_especialidad
      LEFT JOIN docente d ON d.id_docente = p.id_asesor
      LEFT JOIN persona perAse ON perAse.id_persona = d.id_persona
      WHERE p.id_proyecto = ?
    `,
      [id_proyecto]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("ERROR getProyectoDetalles:", err);
    res.status(500).json({ message: "Error interno", error: err.message });
  }
};

const crearUsuario = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (req.user.rol !== "COORDINACION") {
      return res.status(403).json({ message: "Acceso solo para coordinación" });
    }

    const {
      nombres,
      apellido_paterno,
      apellido_materno,
      dni,
      correo,
      telefono,
      direccion,
      username,
      password,
      rol,
      codigo_estudiante,
      fecha_egreso,
      fecha_nacimiento,
      sexo,
    } = req.body;

    if (
      !nombres ||
      !apellido_paterno ||
      !dni ||
      !username ||
      !password ||
      !rol
    ) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    if (!["ESTUDIANTE", "DOCENTE"].includes(rol)) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    if (rol === "ESTUDIANTE" && !codigo_estudiante) {
      return res
        .status(400)
        .json({ message: "Código de estudiante requerido" });
    }

    await connection.beginTransaction();

    const [existingUser] = await connection.query(
      "SELECT id_usuario FROM usuario WHERE username = ?",
      [username]
    );
    if (existingUser.length > 0) throw new Error("Usuario ya existe");

    const [existingPersona] = await connection.query(
      "SELECT id_persona FROM persona WHERE numero_documento = ?",
      [dni]
    );
    if (existingPersona.length > 0) throw new Error("DNI ya registrado");

    if (rol === "ESTUDIANTE") {
      const [existingCodigo] = await connection.query(
        "SELECT id_estudiante FROM estudiante WHERE codigo_estudiante = ?",
        [codigo_estudiante]
      );
      if (existingCodigo.length > 0)
        throw new Error("Código de estudiante ya registrado");
    }

    const [personaResult] = await connection.query(
      `INSERT INTO persona 
         (nombres, apellido_paterno, apellido_materno, tipo_documento, numero_documento, correo, telefono, direccion, fecha_nacimiento, sexo) 
       VALUES (?, ?, ?, 'DNI', ?, ?, ?, ?, ?, ?)`,
      [
        nombres,
        apellido_paterno,
        apellido_materno || "",
        dni,
        correo || null,
        telefono || null,
        direccion || null,
        fecha_nacimiento || null,
        sexo || null,
      ]
    );
    const id_persona = personaResult.insertId;

    const [rolResult] = await connection.query(
      "SELECT id_rol FROM rol WHERE nombre = ?",
      [rol]
    );
    const id_rol = rolResult[0].id_rol;

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);
    const [usuarioResult] = await connection.query(
      `INSERT INTO usuario (id_persona, id_rol, username, password_hash, activo) 
       VALUES (?, ?, ?, ?, 1)`,
      [id_persona, id_rol, username, hashedPassword]
    );

    if (rol === "ESTUDIANTE") {
      await connection.query(
        `INSERT INTO estudiante (id_persona, codigo_estudiante, escuela_profesional, fecha_egreso) 
         VALUES (?, ?, 'Ingeniería de Sistemas', ?)`,
        [id_persona, codigo_estudiante, req.body.fecha_egreso || null]
      );
    } else if (rol === "DOCENTE") {
      await connection.query(
        `INSERT INTO docente (id_persona, categoria, grado_academico) 
         VALUES (?, 'CONTRATADO', 'MAGISTER')`,
        [id_persona]
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Usuario creado exitosamente" });
  } catch (err) {
    await connection.rollback();
    console.error("ERROR crearUsuario:", err);
    res.status(400).json({ message: err.message || "Error al crear usuario" });
  } finally {
    connection.release();
  }
};

module.exports = {
  validarAsesor,
  revisarFormato,
  asignarJurados,
  dictamenFinal,
  validarFormatoBorrador,
  getProyectosPendientes,
  getBorradoresPendientes,
  getSustentacionesProgramadas,
  getProyectoDetalles,
  getProyectosAprobadosJurados,
  dictamenFinalBorrador,
  getBorradoresAprobadosJurados,
  crearUsuario,
};
