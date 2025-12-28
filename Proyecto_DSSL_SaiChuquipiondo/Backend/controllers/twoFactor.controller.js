const {
  generarSecreto2FA,
  verificarToken2FA,
  habilitar2FA,
  deshabilitar2FA,
  tiene2FAHabilitado,
} = require("../utils/twoFactor");
const { registrarAuditoria, ACCIONES_AUDITORIA } = require("../utils/audit");
const logger = require("../config/logger");

/**
 * Genera el secreto y QR para configurar 2FA
 * Solo para usuarios con rol COORDINACION
 */
const setup2FA = async (req, res) => {
  try {
    const { id_usuario, rol } = req.user;

    if (rol !== "COORDINACION") {
      return res.status(403).json({
        success: false,
        message: "2FA solo disponible para coordinación",
      });
    }

    const result = await generarSecreto2FA(id_usuario);

    res.json({
      success: true,
      message: "Escanea el código QR con Google Authenticator",
      ...result,
    });
  } catch (error) {
    logger.error("Error en setup2FA:", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al configurar 2FA",
    });
  }
};

/**
 * Habilitar 2FA verificando el token
 */
const enable2FA = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token requerido",
      });
    }

    const result = await habilitar2FA(id_usuario, token);

    if (result.success) {
      await registrarAuditoria(
        id_usuario,
        ACCIONES_AUDITORIA.HABILITAR_2FA,
        "usuario",
        id_usuario,
        {},
        req
      );
    }

    res.json(result);
  } catch (error) {
    logger.error("Error en enable2FA:", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al habilitar 2FA",
    });
  }
};

/**
 * Deshabilitar 2FA
 */
const disable2FA = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const result = await deshabilitar2FA(id_usuario);

    if (result.success) {
      await registrarAuditoria(
        id_usuario,
        ACCIONES_AUDITORIA.DESHABILITAR_2FA,
        "usuario",
        id_usuario,
        {},
        req
      );
    }

    res.json(result);
  } catch (error) {
    logger.error("Error en disable2FA:", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al deshabilitar 2FA",
    });
  }
};

/**
 * Verificar estado de 2FA del usuario actual
 */
const status2FA = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const habilitado = await tiene2FAHabilitado(id_usuario);

    res.json({
      success: true,
      habilitado,
    });
  } catch (error) {
    logger.error("Error en status2FA:", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al verificar estado 2FA",
    });
  }
};

module.exports = {
  setup2FA,
  enable2FA,
  disable2FA,
  status2FA,
};
