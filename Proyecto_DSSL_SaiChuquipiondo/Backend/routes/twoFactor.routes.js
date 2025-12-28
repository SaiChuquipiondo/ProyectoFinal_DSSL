const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  setup2FA,
  enable2FA,
  disable2FA,
  status2FA,
} = require("../controllers/twoFactor.controller");

// Obtener estado de 2FA
router.get("/status", auth, status2FA);

// Generar secreto y QR (primer paso)
router.post("/setup", auth, setup2FA);

// Habilitar 2FA con verificación de token
router.post("/enable", auth, enable2FA);

// Deshabilitar 2FA
router.post("/disable", auth, disable2FA);

module.exports = router;
