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
  misProyectos,
  misBorradores,
  miActa,
} = require("../controllers/estudiante.controller");

// Proyectos
router.get("/mis-proyectos", auth, misProyectos);
router.post("/proyecto/subir", auth, uploadProyecto, subirProyecto);
router.post("/proyecto/elegir-asesor/:id_proyecto", auth, elegirAsesor);

// Borradores
router.get("/mis-borradores", auth, misBorradores);
router.post("/borrador/subir", auth, uploadBorrador, subirBorrador);

// Tesis Final
router.post("/tesis/subir-final", auth, uploadTesisFinal, subirTesisFinal);

// Resoluciones y Actas
router.get("/mis-resoluciones", auth, misResoluciones);
router.get("/mi-acta", auth, miActa);

module.exports = router;
