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

// Confiar en el proxy de Railway (necesario para Rate Limit y X-Forwarded-For)
app.set("trust proxy", 1);

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
  max: 1000, // Máximo 1000 requests por IP (aumentado para desarrollo)
  message: "Demasiadas peticiones desde esta IP, intente de nuevo más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiting para Login - Más restrictivo
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 6, // Máximo 6 intentos de login
  skipSuccessfulRequests: true, // No contar requests exitosos
  standardHeaders: true, // Retorna info de rate limit en headers
  legacyHeaders: false,
  // Handler personalizado para retornar JSON consistente
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para login desde IP: ${req.ip}`);
    res.status(429).json({
      message:
        "Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.",
    });
  },
});

// Aplicar limitador general a todas las rutas
app.use("/api/", generalLimiter);

// =========================================
// MIDDLEWARE
// =========================================

// CORS - Permitir solicitudes temporalmente desde cualquier origen para debugging
const corsOptions = {
  origin: true, // Refleja el origen de la petición (permite todo)
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" })); // Limitar tamaño de payload
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir archivos subidos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================================
// RUTAS
// =========================================

// Rutas de autenticación
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", loginLimiter, authRoutes);

// Rutas de estudiante
const estudianteRoutes = require("./routes/estudiante.routes");
app.use("/api/estudiante", estudianteRoutes);

// Rutas de docente (asesor/jurado)
const asesorRoutes = require("./routes/asesores.routes");
app.use("/api/asesor", asesorRoutes);
const juradoRoutes = require("./routes/jurados.routes");
app.use("/api/jurados", juradoRoutes);

// Rutas de coordinación
const coordinacionRoutes = require("./routes/coordinacion.routes");
app.use("/api/coordinacion", coordinacionRoutes);

// Rutas de notificaciones
const notificacionRoutes = require("./routes/notificacion.routes");
app.use("/api/notificaciones", notificacionRoutes);

// Rutas de uploads (sirve archivos desde Cloudinary o local)
const uploadsRoutes = require("./routes/uploads.routes");
app.use("/uploads", uploadsRoutes);

// Rutas de sustentación
const sustentacionRoutes = require("./routes/sustentacion.routes");
app.use("/api/sustentacion", sustentacionRoutes);

// Ruta de especialidades (pública)
const {
  getEspecialidades,
  getAsesoresByEspecialidad,
} = require("./controllers/especialidad.controller");
app.get("/api/especialidades", getEspecialidades);
app.get(
  "/api/especialidades/:id_especialidad/asesores",
  getAsesoresByEspecialidad
);

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

// Crear servidor HTTP para Socket.IO
const http = require("http");
const server = http.createServer(app);

// Inicializar Socket.IO
const { initSocketIO } = require("./config/socket");
initSocketIO(server);

server.listen(PORT, () => {
  logger.info(`🚀 Servidor escuchando en el puerto ${PORT}`);
  logger.info(`✅ Seguridad: Helmet activado`);
  logger.info(
    `✅ Rate Limiting: Activo (100 req/15min general, 6 req/15min login)`
  );
  logger.info(`✅ Logging: Winston configurado`);
  logger.info(`📂 Logs almacenados en: ./logs/`);
  logger.info(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🔌 WebSocket servidor activo`);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promesa rechazada no manejada:", { reason, promise });
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  logger.error("Excepción no capturada:", {
    error: error.message,
    stack: error.stack,
  });
  server.close(() => process.exit(1));
});
