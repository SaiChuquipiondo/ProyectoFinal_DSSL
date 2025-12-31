const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  listarTesisFinales,
  generarResolucion,
  descargarResolucion,
  programarSustentacion,
  registrarResultado,
  generarActaPDF,
  descargarActa,
} = require("../controllers/sustentacion.controller");

router.get("/tesis-finales", auth, listarTesisFinales);
router.post("/resolucion/:id_proyecto", auth, generarResolucion);
router.get("/descargar/:id_resolucion", auth, descargarResolucion);
router.post("/programar/:id_proyecto", auth, programarSustentacion);
router.post("/registrar-resultado/:id_sustentacion", auth, registrarResultado);
router.post("/generar-acta/:id_sustentacion", auth, generarActaPDF);
router.get("/descargar-acta/:id_acta", auth, descargarActa);

module.exports = router;
