const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  listarVersionesAsesor,
  obtenerUltimaVersionPendiente,
  revisarVersion,
} = require("../controllers/asesore.controller");

// Ver todas las versiones de tesis del asesor
router.get("/versiones", authMiddleware, listarVersionesAsesor);

// Ver solo la última versión pendiente de revisar
router.get(
  "/version-pendiente/:id_tesis",
  authMiddleware,
  obtenerUltimaVersionPendiente
);

// Revisar una versión específica
router.post("/revisar/:id_version", authMiddleware, revisarVersion);

module.exports = router;
