const pool = require("../config/database");

const notificar = async (id_usuario, titulo, mensaje) => {
  await pool.query(
    `INSERT INTO notificacion (id_usuario, titulo, mensaje)
     VALUES (?, ?, ?)`,
    [id_usuario, titulo, mensaje]
  );
};

module.exports = {
  notificar,
};
