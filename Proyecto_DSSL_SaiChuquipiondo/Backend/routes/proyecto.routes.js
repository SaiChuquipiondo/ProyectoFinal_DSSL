const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const uploadProyecto = require("../middleware/uploadProyecto");

const {
  subirProyecto,
  revisarFormato,
  revisionAsesor,
  asignarJurados,
  revisionJurado,
  dictamenFinal,
} = require("../controllers/proyecto.controller");

// SUBIR PROYECTO (ESTUDIANTE)
router.post("/subir", auth, uploadProyecto, subirProyecto);

// REVISIÓN DE FORMATO (COORDINACIÓN)
router.post("/revisar-formato/:id_proyecto", auth, revisarFormato);

// REVISIÓN DEL ASESOR (DOCENTE)
router.post("/revisar-asesor/:id_proyecto", auth, revisionAsesor);

// ASIGNAR JURADOS (COORDINACIÓN)
router.post("/asignar-jurados/:id_proyecto", auth, asignarJurados);

// REVISIÓN JURADO (DOCENTE)
router.post("/revisar-jurado/:id_proyecto", auth, revisionJurado);

// DICTAMEN FINAL (COORDINACIÓN)
router.post("/dictamen/:id_proyecto", auth, dictamenFinal);

module.exports = router;
