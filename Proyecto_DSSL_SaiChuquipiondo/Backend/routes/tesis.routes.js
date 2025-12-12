const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const uploadTesis = require("../middleware/uploadTesis");
const { subirVersion } = require("../controllers/tesis.controller");
const {
  getMisTesis,
  registrarTesis,
} = require("../controllers/tesis.controller");

router.get("/mias", authMiddleware, getMisTesis);
router.post("/registrar", authMiddleware, registrarTesis);
router.post(
  "/subir-version/:id_tesis",
  authMiddleware,
  uploadTesis,
  subirVersion
);

module.exports = router;
