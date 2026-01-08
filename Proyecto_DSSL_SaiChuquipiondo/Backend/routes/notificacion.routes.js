const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  listarNotificaciones,
  contarNoLeidasController,
  marcarLeido,
  marcarTodasLeidas,
} = require("../controllers/notificacion.controller");

router.get("/", auth, listarNotificaciones);
router.get("/no-leidas/contar", auth, contarNoLeidasController);

router.put("/:id_notificacion/marcar-leida", auth, marcarLeido);

router.put("/marcar-todas-leidas", auth, marcarTodasLeidas);

module.exports = router;
