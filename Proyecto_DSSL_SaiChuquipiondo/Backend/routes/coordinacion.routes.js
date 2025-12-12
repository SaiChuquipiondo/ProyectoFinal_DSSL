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
} = require("../controllers/coordinacion.controller");

router.get("/pendientes/asesor", auth, pendientesAsesor);
router.get("/pendientes/formato", auth, pendientesFormato);
router.get("/pendientes/jurados", auth, pendientesJurados);
router.get("/pendientes/dictamen", auth, pendientesDictamen);

router.post("/proyecto/validar-asesor/:id_proyecto", auth, validarAsesor);
router.post("/proyecto/revisar-formato/:id_proyecto", auth, revisarFormato);
router.post("/proyecto/asignar-jurados/:id_proyecto", auth, asignarJurados);
router.post("/proyecto/dictamen/:id_proyecto", auth, dictamenFinal);

router.post("/borrador/validar/:id_borrador", auth, validarFormatoBorrador);

module.exports = router;
