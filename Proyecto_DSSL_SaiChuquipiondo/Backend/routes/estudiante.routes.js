const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const uploadProyecto = require("../middleware/uploadProyecto");
const uploadBorrador = require("../middleware/uploadBorrador");
const uploadTesisFinal = require("../middleware/uploadTesisFinal");
const {
  subirProyecto,
  elegirAsesor,
  subirBorrador,
  subirTesisFinal,
  misResoluciones,
} = require("../controllers/estudiante.controller");

router.post("/proyecto/subir", auth, uploadProyecto, subirProyecto);
router.post("/proyecto/elegir-asesor/:id_proyecto", auth, elegirAsesor);

router.post("/borrador/subir", auth, uploadBorrador, subirBorrador);
router.post("/tesis/subir-final", auth, uploadTesisFinal, subirTesisFinal);

router.get("/mis-resoluciones", auth, misResoluciones);

module.exports = router;
