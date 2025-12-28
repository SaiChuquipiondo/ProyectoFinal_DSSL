const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
require("dotenv").config();

// Importar logger y error handlers
const logger = require("./config/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// =========================================
// LOGGING
// =========================================

// Morgan para logging HTTP - integrado con Winston
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, { stream: logger.stream }));

// =========================================
// SEGURIDAD
// =========================================

// Helmet - Configuración de headers de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// Rate Limiting General - Limitar requests globales
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP
  message: "Demasiadas peticiones desde esta IP, intente de nuevo más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiting para Login - Más restrictivo
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login
  message:
    "Demasiados intentos de inicio de sesión, intente de nuevo en 15 minutos.",
  skipSuccessfulRequests: true, // No contar requests exitosos
});

// Aplicar limitador general a todas las rutas
app.use("/api/", generalLimiter);

// =========================================
// MIDDLEWARE
// =========================================

app.use(cors());
app.use(express.json({ limit: "10mb" })); // Limitar tamaño de payload
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir archivos subidos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================================
// RUTAS
// =========================================

// Auth con rate limiting específico
app.use("/api/auth", loginLimiter, require("./routes/auth.routes"));

// Resto de rutas
app.use("/api/estudiante", require("./routes/estudiante.routes"));
app.use("/api/asesor", require("./routes/asesores.routes"));
app.use("/api/jurado", require("./routes/jurados.routes"));
app.use("/api/coordinacion", require("./routes/coordinacion.routes"));
app.use("/api/notificaciones", require("./routes/notificacion.routes"));
app.use("/api/sustentacion", require("./routes/sustentacion.routes"));

// =========================================
// MANEJO DE ERRORES GLOBAL
// =========================================

// Ruta no encontrada - Usar middleware mejorado
app.use(notFound);

// Manejo de errores global - Usar middleware mejorado
app.use(errorHandler);

// =========================================
// SERVIDOR
// =========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Servidor escuchando en el puerto ${PORT}`);
  logger.info(`✅ Seguridad: Helmet activado`);
  logger.info(
    `✅ Rate Limiting: Activo (100 req/15min general, 5 req/15min login)`
  );
  logger.info(`✅ Logging: Winston configurado`);
  logger.info(`📂 Logs almacenados en: ./logs/`);
  logger.info(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promesa rechazada no manejada:", { reason, promise });
});

process.on("uncaughtException", (error) => {
  logger.error("Excepción no capturada:", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
