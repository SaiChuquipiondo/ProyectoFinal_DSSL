const { body, param, validationResult } = require("express-validator");

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Errores de validación",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// ===============================
// VALIDADORES PARA AUTH
// ===============================

const validateLogin = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("El usuario es obligatorio")
    .isLength({ min: 3, max: 100 })
    .withMessage("El usuario debe tener entre 3 y 100 caracteres")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "El usuario solo puede contener letras, números y guiones bajos"
    ),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
    .isLength({ min: 6, max: 255 })
    .withMessage("La contraseña debe tener entre 6 y 255 caracteres"),

  handleValidationErrors,
];

// ===============================
// VALIDADORES PARA PROYECTOS
// ===============================

const validateElegirAsesor = [
  param("id_proyecto").isInt({ min: 1 }).withMessage("ID de proyecto inválido"),

  body("id_docente").isInt({ min: 1 }).withMessage("ID de docente inválido"),

  handleValidationErrors,
];

// ===============================
// VALIDADORES PARA COORDINACIÓN
// ===============================

const validateValidarAsesor = [
  param("id_proyecto").isInt({ min: 1 }).withMessage("ID de proyecto inválido"),

  body("aprobar").isBoolean().withMessage("El campo aprobar debe ser booleano"),

  body("observaciones")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las observaciones no pueden exceder 1000 caracteres"),

  handleValidationErrors,
];

const validateRevisarFormato = [
  param("id_proyecto").isInt({ min: 1 }).withMessage("ID de proyecto inválido"),

  body("aprobar").isBoolean().withMessage("El campo aprobar debe ser booleano"),

  body("observaciones")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las observaciones no pueden exceder 1000 caracteres"),

  handleValidationErrors,
];

const validateAsignarJurados = [
  param("id_proyecto").isInt({ min: 1 }).withMessage("ID de proyecto inválido"),

  body("id_jurado_1").isInt({ min: 1 }).withMessage("ID del jurado 1 inválido"),

  body("id_jurado_2").isInt({ min: 1 }).withMessage("ID del jurado 2 inválido"),

  body("id_jurado_3").isInt({ min: 1 }).withMessage("ID del jurado 3 inválido"),

  handleValidationErrors,
];

const validateDictamen = [
  param("id_proyecto").isInt({ min: 1 }).withMessage("ID de proyecto inválido"),

  body("dictamen")
    .isIn(["APROBADO", "RECHAZADO"])
    .withMessage("El dictamen debe ser APROBADO o RECHAZADO"),

  body("observaciones")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las observaciones no pueden exceder 1000 caracteres"),

  handleValidationErrors,
];

// ===============================
// VALIDADORES PARA SUSTENTACIÓN
// ===============================

const validateProgramarSustentacion = [
  param("id_proyecto").isInt({ min: 1 }).withMessage("ID de proyecto inválido"),

  body("fecha_sustentacion")
    .notEmpty()
    .withMessage("La fecha de sustentación es obligatoria")
    .isDate()
    .withMessage("Formato de fecha inválido"),

  body("hora")
    .notEmpty()
    .withMessage("La hora es obligatoria")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Formato de hora inválido (HH:MM)"),

  body("lugar")
    .trim()
    .notEmpty()
    .withMessage("El lugar es obligatorio")
    .isLength({ max: 200 })
    .withMessage("El lugar no puede exceder 200 caracteres"),

  handleValidationErrors,
];

const validateRegistrarResultado = [
  param("id_sustentacion")
    .isInt({ min: 1 })
    .withMessage("ID de sustentación inválido"),

  body("nota")
    .isFloat({ min: 0, max: 20 })
    .withMessage("La nota debe estar entre 0 y 20"),

  body("dictamen")
    .isIn(["APROBADO", "DESAPROBADO"])
    .withMessage("El dictamen debe ser APROBADO o DESAPROBADO"),

  handleValidationErrors,
];

// ===============================
// VALIDADORES PARA ASESOR/JURADO
// ===============================

const validateRevisarProyecto = [
  param("id_proyecto").isInt({ min: 1 }).withMessage("ID de proyecto inválido"),

  body("estado")
    .isIn(["APROBADO", "OBSERVADO"])
    .withMessage("El estado debe ser APROBADO u OBSERVADO"),

  body("observaciones")
    .trim()
    .notEmpty()
    .withMessage("Las observaciones son obligatorias")
    .isLength({ max: 2000 })
    .withMessage("Las observaciones no pueden exceder 2000 caracteres"),

  handleValidationErrors,
];

const validateRevisarBorrador = [
  param("id_borrador").isInt({ min: 1 }).withMessage("ID de borrador inválido"),

  body("observaciones")
    .trim()
    .notEmpty()
    .withMessage("Las observaciones son obligatorias")
    .isLength({ max: 2000 })
    .withMessage("Las observaciones no pueden exceder 2000 caracteres"),

  body("aprobar").isBoolean().withMessage("El campo aprobar debe ser booleano"),

  handleValidationErrors,
];

module.exports = {
  validateLogin,
  validateElegirAsesor,
  validateValidarAsesor,
  validateRevisarFormato,
  validateAsignarJurados,
  validateDictamen,
  validateProgramarSustentacion,
  validateRegistrarResultado,
  validateRevisarProyecto,
  validateRevisarBorrador,
};
