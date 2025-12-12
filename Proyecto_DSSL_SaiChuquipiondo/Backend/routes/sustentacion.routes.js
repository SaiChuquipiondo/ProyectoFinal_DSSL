const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  generarResolucion,
  descargarResolucion,
} = require("../controllers/sustentacion.controller");

router.post("/resolucion/:id_proyecto", auth, generarResolucion);
router.get("/descargar/:id_resolucion", auth, descargarResolucion);

module.exports = router;
