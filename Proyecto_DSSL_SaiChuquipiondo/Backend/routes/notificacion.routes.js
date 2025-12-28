const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  listarNotificaciones,
  contarNoLeidasController,
  marcarLeido,
  marcarTodasLeidas,
} = require("../controllers/notificacion.controller");

// Obtener notificaciones del usuario
router.get("/", auth, listarNotificaciones);

// Contar notificaciones no leídas
router.get("/no-leidas/contar", auth, contarNoLeidasController);

// Marcar una notificación como leída
router.put("/:id_notificacion/marcar-leida", auth, marcarLeido);

// Marcar todas las notificaciones como leídas
router.put("/marcar-todas-leidas", auth, marcarTodasLeidas);

module.exports = router;
