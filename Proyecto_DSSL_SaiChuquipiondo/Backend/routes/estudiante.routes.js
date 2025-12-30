const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const uploadProyecto = require("../middleware/uploadProyecto");
const uploadBorrador = require("../middleware/uploadBorrador");
const uploadTesisFinal = require("../middleware/uploadTesisFinal");
const {
  subirProyecto,
  actualizarProyecto,
  getProyectoById,
  elegirAsesor,
  subirBorrador,
  subirTesisFinal,
  misResoluciones,
  misProyectos,
  misBorradores,
  miActa,
  getRevisionAsesor,
} = require("../controllers/estudiante.controller");

// Proyectos
router.get("/mis-proyectos", auth, misProyectos);
router.get("/proyectos/:id_proyecto", auth, getProyectoById);
router.post("/proyecto/subir", auth, uploadProyecto, subirProyecto);
router.put("/proyectos/:id_proyecto", auth, uploadProyecto, actualizarProyecto);
router.post("/proyecto/elegir-asesor/:id_proyecto", auth, elegirAsesor);
router.get("/proyectos/:id_proyecto/revision-asesor", auth, getRevisionAsesor);

// Borradores
router.get("/mis-borradores", auth, misBorradores);
router.post("/borrador/subir", auth, uploadBorrador, subirBorrador);

// Tesis Final
router.post("/tesis/subir-final", auth, uploadTesisFinal, subirTesisFinal);

// Resoluciones y Actas
router.get("/mis-resoluciones", auth, misResoluciones);
router.get("/mi-acta", auth, miActa);

module.exports = router;
