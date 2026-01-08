const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
require("dotenv").config();

const logger = require("./config/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);

const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, { stream: logger.stream }));

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

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Demasiadas peticiones desde esta IP, intente de nuevo más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para login desde IP: ${req.ip}`);
    res.status(429).json({
      message:
        "Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.",
    });
  },
});

app.use("/api/", generalLimiter);

const allowedOrigins = [
  "http://localhost:4200",
  "https://gestesis.up.railway.app",
  "https://tesisapi.up.railway.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    } else {
      const originClean = origin.replace(/\/$/, "");
      if (allowedOrigins.some((o) => o.replace(/\/$/, "") === originClean)) {
        return callback(null, true);
      }

      console.log(`[CORS BLOQUEADO] Origen no permitido: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", loginLimiter, authRoutes);

const estudianteRoutes = require("./routes/estudiante.routes");
app.use("/api/estudiante", estudianteRoutes);

const asesorRoutes = require("./routes/asesores.routes");
app.use("/api/asesor", asesorRoutes);
const juradoRoutes = require("./routes/jurados.routes");
app.use("/api/jurados", juradoRoutes);
const coordinacionRoutes = require("./routes/coordinacion.routes");
app.use("/api/coordinacion", coordinacionRoutes);

const notificacionRoutes = require("./routes/notificacion.routes");
app.use("/api/notificaciones", notificacionRoutes);

const uploadsRoutes = require("./routes/uploads.routes");
app.use("/uploads", uploadsRoutes);

const sustentacionRoutes = require("./routes/sustentacion.routes");
app.use("/api/sustentacion", sustentacionRoutes);

const {
  getEspecialidades,
  getAsesoresByEspecialidad,
} = require("./controllers/especialidad.controller");
app.get("/api/especialidades", getEspecialidades);
app.get(
  "/api/especialidades/:id_especialidad/asesores",
  getAsesoresByEspecialidad
);

app.use(notFound);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const http = require("http");
const server = http.createServer(app);

const { initSocketIO } = require("./config/socket");
initSocketIO(server);

server.listen(PORT, () => {
  logger.info(`Servidor escuchando en el puerto ${PORT}`);
  logger.info(`Seguridad: Helmet activado`);
  logger.info(
    `Rate Limiting: Activo (100 req/15min general, 6 req/15min login)`
  );
  logger.info(`Logging: Winston configurado`);
  logger.info(`Logs almacenados en: ./logs/`);
  logger.info(`Entorno: ${process.env.NODE_ENV || "development"}`);
  logger.info(`WebSocket servidor activo`);
});

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
