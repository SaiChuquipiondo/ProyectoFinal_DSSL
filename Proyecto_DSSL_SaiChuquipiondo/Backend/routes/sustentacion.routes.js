const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const uploadSolicitud = require("../middleware/uploadSolicitud");

const {
  enviarSolicitud,
  aprobarSolicitud,
  programarSustentacion,
  obtenerSustentacion,
} = require("../controllers/sustentacion.controller");

// Enviar solicitud + PDF
router.post(
  "/solicitar/:id_tesis",
  authMiddleware,
  uploadSolicitud,
  enviarSolicitud
);

router.post("/aprobar/:id_solicitud", authMiddleware, aprobarSolicitud);
router.post("/programar/:id_tesis", authMiddleware, programarSustentacion);
router.get("/:id_tesis", authMiddleware, obtenerSustentacion);

module.exports = router;
