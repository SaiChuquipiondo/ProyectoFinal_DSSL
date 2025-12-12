const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  listarPendientesAsesor,
  revisionAsesor,
  revisarBorradorAsesor,
  borradoresPendientesAsesor,
} = require("../controllers/asesore.controller");

router.get("/pendientes", auth, listarPendientesAsesor);
router.post("/proyecto/revisar/:id_proyecto", auth, revisionAsesor);

// Listar borradores pendientes
router.get("/borrador/pendientes", auth, borradoresPendientesAsesor);

// Revisar borrador
router.post("/borrador/revisar/:id_borrador", auth, revisarBorradorAsesor);

module.exports = router;
