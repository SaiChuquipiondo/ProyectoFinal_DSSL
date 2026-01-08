const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./logger");

let io;
const userSockets = new Map();

const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
    },
  });

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

  io.on("connection", (socket) => {
    const userId = socket.userId;

    userSockets.set(userId, socket.id);

    logger.info(`WebSocket conectado: usuario=${userId}, socket=${socket.id}`);

    socket.join(`user_${userId}`);

    socket.emit("connected", {
      message: "Conectado al servidor de notificaciones",
      userId,
    });

    socket.on("disconnect", () => {
      userSockets.delete(userId);
      logger.info(`WebSocket desconectado: usuario=${userId}`);
    });
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  logger.info("Servidor WebSocket inicializado");
  return io;
};

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

const emitContadorNotificaciones = (id_usuario, contador) => {
  if (!io) return;

  io.to(`user_${id_usuario}`).emit("actualizar_contador", {
    no_leidas: contador,
  });
};

const usuarioConectado = (id_usuario) => {
  return userSockets.has(id_usuario);
};

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
