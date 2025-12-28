const logger = require("../config/logger");

// =========================================
// CLASES DE ERROR PERSONALIZADAS
// =========================================

/**
 * Error base de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de validación (400)
 */
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

/**
 * Error de autenticación (401)
 */
class AuthenticationError extends AppError {
  constructor(message = "No autenticado") {
    super(message, 401);
  }
}

/**
 * Error de autorización (403)
 */
class AuthorizationError extends AppError {
  constructor(message = "No autorizado") {
    super(message, 403);
  }
}

/**
 * Error de recurso no encontrado (404)
 */
class NotFoundError extends AppError {
  constructor(resource = "Recurso") {
    super(`${resource} no encontrado`, 404);
  }
}

/**
 * Error de conflicto (409)
 */
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

/**
 * Error de base de datos (500)
 */
class DatabaseError extends AppError {
  constructor(message = "Error en la base de datos", isOperational = false) {
    super(message, 500, isOperational);
  }
}

// =========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =========================================

/**
 * Manejo de errores global
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Logging del error
  if (err.isOperational) {
    logger.warn(`Error operacional: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.error(`Error no manejado: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Errores de MySQL/MariaDB
  if (err.code === "ER_DUP_ENTRY") {
    error = new ConflictError("El registro ya existe");
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    error = new ValidationError("Referencia inválida a registro inexistente");
  }

  // Errores de Multer (upload de archivos)
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      error = new ValidationError(
        "El archivo excede el tamaño máximo permitido"
      );
    } else {
      error = new ValidationError(`Error al subir archivo: ${err.message}`);
    }
  }

  // Errores de JWT
  if (err.name === "JsonWebTokenError") {
    error = new AuthenticationError("Token inválido");
  }

  if (err.name === "TokenExpiredError") {
    error = new AuthenticationError("Token expirado");
  }

  // Respuesta al cliente
  const statusCode = error.statusCode || 500;
  const message = error.message || "Error interno del servidor";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
        details: error,
      }),
    },
  });
};

/**
 * Wrapper para funciones async - Captura errores automáticamente
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Manejo de rutas no encontradas
 */
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Ruta ${req.originalUrl}`);
  next(error);
};

module.exports = {
  // Clases de error
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  // Middlewares
  errorHandler,
  asyncHandler,
  notFound,
};
