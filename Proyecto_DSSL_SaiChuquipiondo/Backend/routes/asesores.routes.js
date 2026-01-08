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

router.get("/borrador/pendientes", auth, borradoresPendientesAsesor);

router.post("/borrador/revisar/:id_borrador", auth, revisarBorradorAsesor);

module.exports = router;
