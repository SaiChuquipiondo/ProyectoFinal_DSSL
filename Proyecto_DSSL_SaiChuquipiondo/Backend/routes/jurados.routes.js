const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  listarPendientesJurado,
  revisionJurado,
  revisarBorradorJurado,
  borradoresPendientesJurado,
} = require("../controllers/jurados.controller");

router.get("/pendientes", auth, listarPendientesJurado);
router.post("/proyecto/revisar/:id_proyecto", auth, revisionJurado);

router.get("/borrador/pendientes", auth, borradoresPendientesJurado);

router.post("/borrador/revisar/:id_borrador", auth, revisarBorradorJurado);

module.exports = router;
