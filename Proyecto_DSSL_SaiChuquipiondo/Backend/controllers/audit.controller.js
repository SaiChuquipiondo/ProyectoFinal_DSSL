const {
  obtenerLogAuditoria,
  obtenerEstadisticasLogin,
} = require("../utils/audit");
const logger = require("../config/logger");

/**
 * Obtiene el log de auditoría con filtros
 * Solo para COORDINACION
 */
const getAuditLog = async (req, res) => {
  try {
    const { rol } = req.user;

    if (rol !== "COORDINACION") {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado: Solo coordinación",
      });
    }

    const filtros = {
      id_usuario: req.query.id_usuario ? parseInt(req.query.id_usuario) : null,
      accion: req.query.accion || null,
      entidad: req.query.entidad || null,
      fecha_desde: req.query.fecha_desde || null,
      fecha_hasta: req.query.fecha_hasta || null,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
    };

    const logs = await obtenerLogAuditoria(filtros);

    res.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error) {
    logger.error("Error en getAuditLog:", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al obtener logs de auditoría",
    });
  }
};

/**
 * Obtiene estadísticas de intentos de login
 */
const getLoginStats = async (req, res) => {
  try {
    const { rol } = req.user;

    if (rol !== "COORDINACION") {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado: Solo coordinación",
      });
    }

    const dias = req.query.dias ? parseInt(req.query.dias) : 7;
    const stats = await obtenerEstadisticasLogin(dias);

    res.json({
      success: true,
      stats,
      dias,
    });
  } catch (error) {
    logger.error("Error en getLoginStats:", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
    });
  }
};

module.exports = {
  getAuditLog,
  getLoginStats,
};
