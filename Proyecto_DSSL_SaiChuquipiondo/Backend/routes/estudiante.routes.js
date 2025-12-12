const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const uploadProyecto = require("../middleware/uploadProyecto");
const uploadBorrador = require("../middleware/uploadBorrador");
const {
  subirProyecto,
  elegirAsesor,
  subirBorrador,
} = require("../controllers/estudiante.controller");

router.post("/proyecto/subir", auth, uploadProyecto, subirProyecto);
router.post("/proyecto/elegir-asesor/:id_proyecto", auth, elegirAsesor);

router.post("/borrador/subir", auth, uploadBorrador, subirBorrador);

module.exports = router;
