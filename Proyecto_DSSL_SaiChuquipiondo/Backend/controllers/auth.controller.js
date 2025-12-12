const pool = require("../config/database");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Usuario y contraseña son obligatorios" });
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
      return res
        .status(401)
        .json({ message: "Usuario o contraseña incorrectos" });
    }

    const user = rows[0];

    if (!user.activo) {
      return res.status(403).json({ message: "Usuario inactivo" });
    }

    // Por ahora comparamos texto plano (123456)
    if (password !== user.password_hash) {
      return res
        .status(401)
        .json({ message: "Usuario o contraseña incorrectos" });
    }

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
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { login };
