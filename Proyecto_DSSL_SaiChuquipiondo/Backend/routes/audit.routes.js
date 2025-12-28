const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getAuditLog,
  getLoginStats,
} = require("../controllers/audit.controller");

// Obtener log de auditoría (solo coordinación)
router.get("/logs", auth, getAuditLog);

// Obtener estadísticas de login
router.get("/login-stats", auth, getLoginStats);

module.exports = router;
