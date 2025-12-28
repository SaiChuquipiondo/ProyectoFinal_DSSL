const pool = require("../config/database");
const logger = require("../config/logger");

// Import WebSocket functions (lazy loading para evitar ciclos)
let socketFunctions;
const getSocketFunctions = () => {
  if (!socketFunctions) {
    socketFunctions = require("../config/socket");
  }
  return socketFunctions;
};

/**
 * Envía una notificación a un usuario
 * @param {number} id_usuario - ID del usuario destinatario
 * @param {string} titulo - Título de la notificación
 * @param {string} mensaje - Mensaje de la notificación
 * @param {string} tipo - Tipo: INFO, SUCCESS, WARNING, ERROR
 * @returns {Promise<number>} ID de la notificación creada
 */
const notificar = async (id_usuario, titulo, mensaje, tipo = "INFO") => {
  try {
    if (!id_usuario || !titulo || !mensaje) {
      throw new Error("id_usuario, titulo y mensaje son obligatorios");
    }

    const tiposValidos = ["INFO", "SUCCESS", "WARNING", "ERROR"];
    if (!tiposValidos.includes(tipo)) {
      logger.warn(`Tipo de notificación inválido: ${tipo}`);
      tipo = "INFO";
    }

    const [result] = await pool.query(
      `INSERT INTO notificacion (id_usuario, titulo, mensaje) 
       VALUES (?, ?, ?)`,
      [id_usuario, titulo, mensaje]
    );

    const id_notificacion = result.insertId;

    logger.info(`Notificación creada: ${titulo}`, {
      id_notificacion,
      id_usuario,
    });

    // ✅ EMITIR VÍA WEBSOCKET en tiempo real
    const socket = getSocketFunctions();
    socket.emitNotificacion(id_usuario, {
      id_notificacion,
      titulo,
      mensaje,
      tipo,
      fecha_creacion: new Date(),
    });

    return id_notificacion;
  } catch (error) {
    logger.error("Error al crear notificación:", {
      error: error.message,
      id_usuario,
      titulo,
    });

    // No lanzar error para no interrumpir flujo principal
    return null;
  }
};

/**
 * Envía notificaciones a múltiples usuarios
 */
const notificarMultiples = async (ids_usuarios, titulo, mensaje) => {
  const notificaciones = [];

  for (const id_usuario of ids_usuarios) {
    const id = await notificar(id_usuario, titulo, mensaje);
    if (id) notificaciones.push(id);
  }

  logger.info(
    `Notificaciones masivas: ${notificaciones.length}/${ids_usuarios.length}`
  );
  return notificaciones;
};

/**
 * Marca una notificación como leída
 */
const marcarComoLeida = async (id_notificacion, id_usuario) => {
  try {
    const [result] = await pool.query(
      `UPDATE notificacion 
       SET leida = TRUE 
       WHERE id_notificacion = ? AND id_usuario = ?`,
      [id_notificacion, id_usuario]
    );

    return result.affectedRows > 0;
  } catch (error) {
    logger.error("Error marcar como leída:", { error: error.message });
    return false;
  }
};

/**
 * Marca todas como leídas
 */
const marcarTodasComoLeidas = async (id_usuario) => {
  try {
    const [result] = await pool.query(
      `UPDATE notificacion SET leida = TRUE WHERE id_usuario = ? AND leida = FALSE`,
      [id_usuario]
    );

    return result.affectedRows;
  } catch (error) {
    logger.error("Error marcar todas:", { error: error.message });
    return 0;
  }
};

/**
 * Obtiene notificaciones de un usuario
 */
const obtenerNotificaciones = async (
  id_usuario,
  solo_no_leidas = false,
  limit = 50
) => {
  try {
    let query = `
      SELECT id_notificacion, titulo, mensaje, leida, fecha_creacion
      FROM notificacion
      WHERE id_usuario = ?
    `;

    if (solo_no_leidas) query += " AND leida = FALSE";
    query += " ORDER BY fecha_creacion DESC LIMIT ?";

    const [notificaciones] = await pool.query(query, [id_usuario, limit]);
    return notificaciones;
  } catch (error) {
    logger.error("Error obtener notificaciones:", { error: error.message });
    return [];
  }
};

/**
 * Cuenta notificaciones no leídas
 */
const contarNoLeidas = async (id_usuario) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as total FROM notificacion WHERE id_usuario = ? AND leida = FALSE`,
      [id_usuario]
    );
    return rows[0].total;
  } catch (error) {
    logger.error("Error contar no leídas:", { error: error.message });
    return 0;
  }
};

module.exports = {
  notificar,
  notificarMultiples,
  marcarComoLeida,
  marcarTodasComoLeidas,
  obtenerNotificaciones,
  contarNoLeidas,
};
