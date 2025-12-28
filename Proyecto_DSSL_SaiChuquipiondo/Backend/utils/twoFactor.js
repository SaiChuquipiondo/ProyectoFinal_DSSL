const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const pool = require("../config/database");
const logger = require("../config/logger");
const crypto = require("crypto");

/**
 * Genera un secreto 2FA para un usuario
 */
const generarSecreto2FA = async (id_usuario) => {
  try {
    // Obtener info del usuario
    const [users] = await pool.query(
      `SELECT u.username, p.nombres, p.apellido_paterno 
       FROM usuario u 
       JOIN persona p ON p.id_persona = u.id_persona 
       WHERE u.id_usuario = ?`,
      [id_usuario]
    );

    if (users.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    const user = users[0];
    const nombre_completo = `${user.nombres} ${user.apellido_paterno}`;

    // Generar secreto
    const secret = speakeasy.generateSecret({
      name: `SGT (${nombre_completo})`,
      issuer: "Sistema Gestión Tesis",
      length: 32,
    });

    // Generar códigos de respaldo
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Guardar en BD (sin habilit still)
    const [existing] = await pool.query(
      "SELECT id_2fa FROM two_factor_auth WHERE id_usuario = ?",
      [id_usuario]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE two_factor_auth 
         SET secret = ?, backup_codes = ?, habilitado = FALSE 
         WHERE id_usuario = ?`,
        [secret.base32, JSON.stringify(backupCodes), id_usuario]
      );
    } else {
      await pool.query(
        `INSERT INTO two_factor_auth (id_usuario, secret, backup_codes, habilitado)
         VALUES (?, ?, ?, FALSE)`,
        [id_usuario, secret.base32, JSON.stringify(backupCodes)]
      );
    }

    // Generar QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    logger.info(`2FA secret generado para usuario ${id_usuario}`);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
    };
  } catch (error) {
    logger.error("Error al generar secreto 2FA:", {
      error: error.message,
      id_usuario,
    });
    throw error;
  }
};

/**
 * Verifica un token 2FA
 */
const verificarToken2FA = async (id_usuario, token) => {
  try {
    const [rows] = await pool.query(
      "SELECT secret, habilitado FROM two_factor_auth WHERE id_usuario = ?",
      [id_usuario]
    );

    if (rows.length === 0) {
      return { valid: false, error: "2FA not configured" };
    }

    const { secret } = rows[0];

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2, // Tolerancia de ±60 segundos
    });

    return { valid: verified };
  } catch (error) {
    logger.error("Error al verificar token 2FA:", { error: error.message });
    return { valid: false, error: error.message };
  }
};

/**
 * Habilita 2FA para un usuario
 */
const habilitar2FA = async (id_usuario, token) => {
  try {
    // Verificar el token primero
    const result = await verificarToken2FA(id_usuario, token);

    if (!result.valid) {
      return { success: false, message: "Token inválido" };
    }

    // Habilitar 2FA
    await pool.query(
      `UPDATE two_factor_auth 
       SET habilitado = TRUE, fecha_habilitacion = NOW() 
       WHERE id_usuario = ?`,
      [id_usuario]
    );

    logger.info(`2FA habilitado para usuario ${id_usuario}`);

    return { success: true, message: "2FA habilitado correctamente" };
  } catch (error) {
    logger.error("Error al habilitar 2FA:", { error: error.message });
    return { success: false, message: error.message };
  }
};

/**
 * Deshabilita 2FA
 */
const deshabilitar2FA = async (id_usuario) => {
  try {
    await pool.query(
      "UPDATE two_factor_auth SET habilitado = FALSE WHERE id_usuario = ?",
      [id_usuario]
    );

    logger.info(`2FA deshabilitado para usuario ${id_usuario}`);
    return { success: true };
  } catch (error) {
    logger.error("Error al deshabilitar 2FA:", { error: error.message });
    return { success: false, message: error.message };
  }
};

/**
 * Verifica si un usuario tiene 2FA habilitado
 */
const tiene2FAHabilitado = async (id_usuario) => {
  try {
    const [rows] = await pool.query(
      "SELECT habilitado FROM two_factor_auth WHERE id_usuario = ?",
      [id_usuario]
    );

    return rows.length > 0 && rows[0].habilitado === 1;
  } catch (error) {
    logger.error("Error al verificar estado 2FA:", { error: error.message });
    return false;
  }
};

module.exports = {
  generarSecreto2FA,
  verificarToken2FA,
  habilitar2FA,
  deshabilitar2FA,
  tiene2FAHabilitado,
};
