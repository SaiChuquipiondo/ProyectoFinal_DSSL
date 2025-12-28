const { doubleCsrf } = require("csrf-csrf");
const cookieParser = require("cookie-parser");
const logger = require("../config/logger");

// Configurar CSRF protection
const {
  invalidCsrfTokenError,
  generateToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () =>
    process.env.CSRF_SECRET || "csrf-secret-change-in-production",
  cookieName: "__Host-psifi.x-csrf-token",
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => req.headers["x-csrf-token"] || req.body._csrf,
});

/**
 * Middleware para manejar errores de CSRF
 */
const csrfErrorHandler = (error, req, res, next) => {
  if (error == invalidCsrfTokenError) {
    logger.warn("Token CSRF inválido", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    return res.status(403).json({
      success: false,
      error: "CSRF token inválido o faltante",
      message:
        "Token de seguridad inválido. Recarga la página e intenta de nuevo.",
    });
  }

  next(error);
};

/**
 * Endpoint para generar un token CSRF
 */
const generarTokenCSRF = (req, res) => {
  try {
    const csrfToken = generateToken(req, res);

    res.json({
      success: true,
      csrfToken,
      message: "Token CSRF generado",
    });
  } catch (error) {
    logger.error("Error al generar token CSRF:", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Error al generar token CSRF",
    });
  }
};

module.exports = {
  cookieParser,
  doubleCsrfProtection,
  csrfErrorHandler,
  generarTokenCSRF,
  generateToken,
};
