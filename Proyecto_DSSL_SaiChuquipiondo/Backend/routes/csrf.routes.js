const express = require("express");
const router = express.Router();
const { generarTokenCSRF } = require("../middleware/csrfProtection");

// Endpoint para obtener token CSRF
router.get("/csrf-token", generarTokenCSRF);

module.exports = router;
