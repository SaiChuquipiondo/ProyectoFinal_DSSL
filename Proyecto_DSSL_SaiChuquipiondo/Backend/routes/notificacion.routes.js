const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  listarNotificaciones,
  marcarLeido,
} = require("../controllers/notificacion.controller");

router.get("/", auth, listarNotificaciones);
router.put("/leido/:id_notificacion", auth, marcarLeido);

module.exports = router;
