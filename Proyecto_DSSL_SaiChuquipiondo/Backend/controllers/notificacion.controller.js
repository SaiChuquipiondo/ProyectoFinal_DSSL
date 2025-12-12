const pool = require("../config/database");

const listarNotificaciones = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [rows] = await pool.query(
      `SELECT id_notificacion, titulo, mensaje, leido, fecha
       FROM notificacion
       WHERE id_usuario = ?
       ORDER BY fecha DESC`,
      [id_usuario]
    );

    res.json(rows);
  } catch (err) {
    console.error("ERROR listarNotificaciones:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

const marcarLeido = async (req, res) => {
  try {
    const { id_notificacion } = req.params;
    const { id_usuario } = req.user;

    await pool.query(
      `UPDATE notificacion
       SET leido = 1
       WHERE id_notificacion = ? AND id_usuario = ?`,
      [id_notificacion, id_usuario]
    );

    res.json({ message: "Notificación marcada como leída" });
  } catch (err) {
    console.error("ERROR marcarLeido:", err);
    res.status(500).json({ message: "Error interno" });
  }
};

module.exports = {
  listarNotificaciones,
  marcarLeido,
};
