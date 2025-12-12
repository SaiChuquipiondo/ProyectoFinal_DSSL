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

// Listar borradores pendientes para jurado
router.get("/borrador/pendientes", auth, borradoresPendientesJurado);

// Revisar borrador
router.post("/borrador/revisar/:id_borrador", auth, revisarBorradorJurado);

module.exports = router;
