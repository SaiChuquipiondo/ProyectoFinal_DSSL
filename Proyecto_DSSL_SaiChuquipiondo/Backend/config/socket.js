const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./logger");

let io;
const userSockets = new Map(); // Map de id_usuario -> socket.id

/**
 * Inicializa el servidor WebSocket
 */
const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
    },
  });

  // Middleware de autenticación
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: Token requerido"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id_usuario;
      socket.userRole = decoded.rol;

      logger.info(`WebSocket: Usuario ${decoded.id_usuario} autenticado`);
      next();
    } catch (error) {
      logger.error("WebSocket auth error:", { error: error.message });
      next(new Error("Authentication error: Token inválido"));
    }
  });

  // Manejo de conexiones
  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Registrar socket del usuario
    userSockets.set(userId, socket.id);

    logger.info(`WebSocket conectado: usuario=${userId}, socket=${socket.id}`);

    // Unir a sala personal
    socket.join(`user_${userId}`);

    // Enviar confirmación de conexión
    socket.emit("connected", {
      message: "Conectado al servidor de notificaciones",
      userId,
    });

    // Manejo de desconexión
    socket.on("disconnect", () => {
      userSockets.delete(userId);
      logger.info(`WebSocket desconectado: usuario=${userId}`);
    });

    // Evento de ping para mantener conexión
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  logger.info("🔌 Servidor WebSocket inicializado");
  return io;
};

/**
 * Emite una notificación a un usuario específico
 */
const emitNotificacion = (id_usuario, notificacion) => {
  if (!io) {
    logger.warn("WebSocket no inicializado");
    return;
  }

  io.to(`user_${id_usuario}`).emit("nueva_notificacion", notificacion);

  logger.debug(`Notificación emit a usuario ${id_usuario}`, {
    titulo: notificacion.titulo,
  });
};

/**
 * Emite una notificación a múltiples usuarios
 */
const emitNotificacionMultiple = (ids_usuarios, notificacion) => {
  if (!io) {
    logger.warn("WebSocket no inicializado");
    return;
  }

  ids_usuarios.forEach((id_usuario) => {
    io.to(`user_${id_usuario}`).emit("nueva_notificacion", notificacion);
  });

  logger.debug(`Notificación emitida a ${ids_usuarios.length} usuarios`);
};

/**
 * Emite actualización del contador de notificaciones
 */
const emitContadorNotificaciones = (id_usuario, contador) => {
  if (!io) return;

  io.to(`user_${id_usuario}`).emit("actualizar_contador", {
    no_leidas: contador,
  });
};

/**
 * Verifica si un usuario está conectado
 */
const usuarioConectado = (id_usuario) => {
  return userSockets.has(id_usuario);
};

/**
 * Obtiene estadísticas de conexiones
 */
const getStats = () => {
  if (!io) return { conectados: 0 };

  const sockets = io.sockets.sockets;
  const conectados = sockets.size;

  return {
    conectados,
    usuarios: Array.from(userSockets.keys()),
  };
};

module.exports = {
  initSocketIO,
  emitNotificacion,
  emitNotificacionMultiple,
  emitContadorNotificaciones,
  usuarioConectado,
  getStats,
};
