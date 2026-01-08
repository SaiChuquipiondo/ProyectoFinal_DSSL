const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  validarAsesor,
  revisarFormato,
  asignarJurados,
  dictamenFinal,
  validarFormatoBorrador,
  getProyectosPendientes,
  getBorradoresPendientes,
  getSustentacionesProgramadas,
  getProyectoDetalles,
  getProyectosAprobadosJurados,
  dictamenFinalBorrador,
  getBorradoresAprobadosJurados,
  crearUsuario,
} = require("../controllers/coordinacion.controller");

const {
  programarSustentacion,
  registrarResultado,
  generarActaPDF,
  descargarActa,
  generarResolucion,
} = require("../controllers/sustentacion.controller");

router.post("/usuarios/crear", auth, crearUsuario);
router.get("/proyectos-pendientes", auth, getProyectosPendientes);
router.get("/proyectos-aprobados-jurados", auth, getProyectosAprobadosJurados);
router.get(
  "/borradores-aprobados-jurados",
  auth,
  getBorradoresAprobadosJurados
);
router.get("/borradores-pendientes", auth, getBorradoresPendientes);
router.get("/sustentaciones-programadas", auth, getSustentacionesProgramadas);
router.get("/proyecto/detalles/:id_proyecto", auth, getProyectoDetalles);

router.post("/proyecto/validar-asesor/:id_proyecto", auth, validarAsesor);
router.post("/proyecto/revisar-formato/:id_proyecto", auth, revisarFormato);
router.post("/proyecto/asignar-jurados/:id_proyecto", auth, asignarJurados);
router.post("/proyecto/dictamen/:id_proyecto", auth, dictamenFinal);

router.post("/borrador/validar/:id_borrador", auth, validarFormatoBorrador);
router.post("/borrador/dictamen/:id_borrador", auth, dictamenFinalBorrador);

router.post(
  "/sustentacion/programar/:id_proyecto",
  auth,
  programarSustentacion
);

router.post(
  "/sustentacion/resultado/:id_sustentacion",
  auth,
  registrarResultado
);

router.post(
  "/sustentacion/acta/generar/:id_sustentacion",
  auth,
  generarActaPDF
);

router.post(
  "/sustentacion/generar-resolucion/:id_proyecto",
  auth,
  generarResolucion
);

router.get("/sustentacion/acta/descargar/:id_acta", auth, descargarActa);

module.exports = router;
