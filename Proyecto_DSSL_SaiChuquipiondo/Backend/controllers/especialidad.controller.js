const pool = require("../config/database");
const logger = require("../config/logger");

const getEspecialidades = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id_especialidad,
        nombre,
        descripcion,
        activo
      FROM especialidad
      WHERE activo = 1
      ORDER BY nombre ASC
    `);

    res.json(rows);
  } catch (error) {
    logger.error("Error obteniendo especialidades:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Error al obtener especialidades" });
  }
};

const getAsesoresByEspecialidad = async (req, res) => {
  try {
    const { id_especialidad } = req.params;

    const [rows] = await pool.query(
      `
      SELECT DISTINCT
        d.id_docente,
        p.nombres,
        p.apellido_paterno,
        p.apellido_materno,
        CONCAT(p.nombres, ' ', p.apellido_paterno, ' ', p.apellido_materno) AS nombre_completo
      FROM docente d
      INNER JOIN persona p ON p.id_persona = d.id_persona
      INNER JOIN docente_especialidad de ON de.id_docente = d.id_docente
      WHERE de.id_especialidad = ?
        AND d.activo = 1
      ORDER BY p.apellido_paterno, p.apellido_materno, p.nombres
      `,
      [id_especialidad]
    );

    res.json(rows);
  } catch (error) {
    logger.error("Error obteniendo asesores por especialidad:", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Error al obtener asesores por especialidad" });
  }
};

module.exports = {
  getEspecialidades,
  getAsesoresByEspecialidad,
};
