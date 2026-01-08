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
  actualizarBorrador,
  subirTesisFinal,
  obtenerMiTesisFinal,
  misResoluciones,
  misProyectos,
  misBorradores,
  miActa,
} = require("../controllers/estudiante.controller");

router.get("/mis-proyectos", auth, misProyectos);
router.get("/proyectos/:id_proyecto", auth, getProyectoById);
router.post("/proyecto/subir", auth, uploadProyecto, subirProyecto);
router.put("/proyectos/:id_proyecto", auth, uploadProyecto, actualizarProyecto);
router.post("/proyecto/elegir-asesor/:id_proyecto", auth, elegirAsesor);

router.get("/mis-borradores", auth, misBorradores);
router.post("/borrador/subir", auth, uploadBorrador, subirBorrador);
router.patch(
  "/borrador/:id_borrador/corregir",
  auth,
  uploadBorrador,
  actualizarBorrador
);

router.post("/tesis-final", auth, uploadTesisFinal, subirTesisFinal);
router.get("/tesis-final", auth, obtenerMiTesisFinal);

router.get("/mis-resoluciones", auth, misResoluciones);
router.get("/mi-acta", auth, miActa);

module.exports = router;
