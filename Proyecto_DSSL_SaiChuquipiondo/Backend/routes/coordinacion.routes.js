const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  pendientesAsesor,
  pendientesFormato,
  pendientesJurados,
  pendientesDictamen,
  validarAsesor,
  revisarFormato,
  asignarJurados,
  dictamenFinal,
  validarFormatoBorrador,
  getProyectosPendientes,
  getBorradoresPendientes,
  getSustentacionesProgramadas,
} = require("../controllers/coordinacion.controller");

const {
  programarSustentacion,
  registrarResultado,
  generarActaPDF,
  descargarActa,
} = require("../controllers/sustentacion.controller");

// ENDPOINTS PARA DASHBOARD
router.get("/proyectos-pendientes", auth, getProyectosPendientes);
router.get("/borradores-pendientes", auth, getBorradoresPendientes);
router.get("/sustentaciones-programadas", auth, getSustentacionesProgramadas);

// ENDPOINTS DETALLADOS
router.get("/pendientes/asesor", auth, pendientesAsesor);
router.get("/pendientes/formato", auth, pendientesFormato);
router.get("/pendientes/jurados", auth, pendientesJurados);
router.get("/pendientes/dictamen", auth, pendientesDictamen);

router.post("/proyecto/validar-asesor/:id_proyecto", auth, validarAsesor);
router.post("/proyecto/revisar-formato/:id_proyecto", auth, revisarFormato);
router.post("/proyecto/asignar-jurados/:id_proyecto", auth, asignarJurados);
router.post("/proyecto/dictamen/:id_proyecto", auth, dictamenFinal);

router.post("/borrador/validar/:id_borrador", auth, validarFormatoBorrador);

// ETAPA 3: PROGRAMAR SUSTENTACIÓN
router.post(
  "/sustentacion/programar/:id_proyecto",
  auth,
  programarSustentacion
);

// ETAPA 3: REGISTRAR RESULTADO (nota/dictamen)
router.post(
  "/sustentacion/resultado/:id_sustentacion",
  auth,
  registrarResultado
);

// ETAPA 3: GENERAR ACTA PDF
router.post(
  "/sustentacion/acta/generar/:id_sustentacion",
  auth,
  generarActaPDF
);

// DESCARGAR ACTA
router.get("/sustentacion/acta/descargar/:id_acta", auth, descargarActa);

module.exports = router;
