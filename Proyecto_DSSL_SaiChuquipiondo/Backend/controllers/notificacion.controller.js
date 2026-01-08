const logger = require("../config/logger");
const {
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  contarNoLeidas,
} = require("../utils/notificar");

const listarNotificaciones = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const solo_no_leidas = req.query.solo_no_leidas === "true";
    const limit = parseInt(req.query.limit) || 50;

    const notificaciones = await obtenerNotificaciones(
      id_usuario,
      solo_no_leidas,
      limit
    );

    res.json({
      success: true,
      notificaciones,
      total: notificaciones.length,
    });
  } catch (err) {
    logger.error("Error listarNotificaciones:", { error: err.message });
    res.status(500).json({ message: "Error interno" });
  }
};

const contarNoLeidasController = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const total = await contarNoLeidas(id_usuario);

    res.json({
      success: true,
      no_leidas: total,
    });
  } catch (err) {
    logger.error("Error contarNoLeidas:", { error: err.message });
    res.status(500).json({ message: "Error interno" });
  }
};

const marcarLeido = async (req, res) => {
  try {
    const { id_notificacion } = req.params;
    const { id_usuario } = req.user;

    const marcada = await marcarComoLeida(id_notificacion, id_usuario);

    if (marcada) {
      res.json({
        success: true,
        message: "Notificación marcada como leída",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Notificación no encontrada o ya estaba leída",
      });
    }
  } catch (err) {
    logger.error("Error marcarLeido:", { error: err.message });
    res.status(500).json({ message: "Error interno" });
  }
};

const marcarTodasLeidas = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const cantidad = await marcarTodasComoLeidas(id_usuario);

    res.json({
      success: true,
      message: `${cantidad} notificación(es) marcada(s) como leída(s)`,
      cantidad,
    });
  } catch (err) {
    logger.error("Error marcarTodasLeidas:", { error: err.message });
    res.status(500).json({ message: "Error interno" });
  }
};

module.exports = {
  listarNotificaciones,
  contarNoLeidasController,
  marcarLeido,
  marcarTodasLeidas,
};
