const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logger = require("../config/logger");
require("dotenv").config();

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validación básica de inputs
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Usuario y contraseña son obligatorios" });
    }

    // Validar formato de username (evitar inyección)
    if (typeof username !== "string" || username.length > 100) {
      return res.status(400).json({ message: "Formato de usuario inválido" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        u.id_usuario,
        u.password_hash,
        u.activo,
        r.nombre AS rol,
        p.id_persona,
        e.id_estudiante,
        d.id_docente
      FROM usuario u
      INNER JOIN persona p ON p.id_persona = u.id_persona
      INNER JOIN rol r      ON r.id_rol = u.id_rol
      LEFT JOIN estudiante e ON e.id_persona = p.id_persona
      LEFT JOIN docente d    ON d.id_persona = p.id_persona
      WHERE u.username = ?
      LIMIT 1
      `,
      [username]
    );

    if (rows.length === 0) {
      logger.warn(
        `Intento de login fallido para usuario inexistente: ${username}`
      );
      return res
        .status(401)
        .json({ message: "Usuario o contraseña incorrectos" });
    }

    const user = rows[0];

    if (!user.activo) {
      logger.warn(`Intento de login de usuario inactivo: ${username}`);
      return res.status(403).json({ message: "Usuario inactivo" });
    }

    // SEGURIDAD: Comparación segura con bcrypt
    // Detectar si la contraseña está hasheada (bcrypt hashes empiezan con $2a$, $2b$, o $2y$)
    let passwordMatch = false;

    if (user.password_hash.startsWith("$2")) {
      // Contraseña hasheada - usar bcrypt
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Compatibilidad temporal con contraseñas en texto plano
      // Esto permite la migración gradual sin romper el sistema
      passwordMatch = password === user.password_hash;

      // Si el login es exitoso, actualizar a bcrypt
      if (passwordMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          "UPDATE usuario SET password_hash = ? WHERE id_usuario = ?",
          [hashedPassword, user.id_usuario]
        );
        logger.info(`Contraseña migrada a bcrypt para usuario: ${username}`);
      }
    }

    if (!passwordMatch) {
      logger.warn(
        `Intento de login fallido (contraseña incorrecta): ${username}`
      );
      return res
        .status(401)
        .json({ message: "Usuario o contraseña incorrectos" });
    }

    // Generar token JWT
    const payload = {
      id_usuario: user.id_usuario,
      id_persona: user.id_persona,
      rol: user.rol,
      id_estudiante: user.id_estudiante,
      id_docente: user.id_docente,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "4h",
    });

    logger.info(`Login exitoso: usuario=${username}, rol=${user.rol}`);

    res.json({
      message: "Login correcto",
      token,
      user: {
        id_usuario: user.id_usuario,
        id_persona: user.id_persona,
        rol: user.rol,
        id_estudiante: user.id_estudiante,
        id_docente: user.id_docente,
      },
    });
  } catch (error) {
    logger.error(`Error en login para usuario ${username}:`, {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { login };
