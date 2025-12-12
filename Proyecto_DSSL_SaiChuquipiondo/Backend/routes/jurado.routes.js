const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  juradosDisponibles,
  asignarJurados,
  listarJurados,
} = require("../controllers/jurado.controller");

// Lista de docentes aptos como jurados según especialidad
router.get("/disponibles/:id_tesis", authMiddleware, juradosDisponibles);

// Asignar jurados
router.post("/asignar/:id_tesis", authMiddleware, asignarJurados);

// Listar jurados asignados
router.get("/:id_tesis", authMiddleware, listarJurados);

module.exports = router;
