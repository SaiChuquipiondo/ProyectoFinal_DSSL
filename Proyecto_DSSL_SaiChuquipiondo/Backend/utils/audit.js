const pool = require("../config/database");
const logger = require("../config/logger");

/**
 * Registra una acción crítica en el log de auditoría
 * @param {number} id_usuario - ID del usuario que realiza la acción
 * @param {string} accion - Nombre de la acción (ej: "APROBAR_PROYECTO", "ASIGNAR_JURADOS")
 * @param {string} entidad - Tipo de entidad afectada (ej: "proyecto", "sustentacion")
 * @param {number} id_entidad - ID de la entidad afectada
 * @param {object} detalles - Detalles adicionales en JSON
 * @param {object} req - Request object (para obtener IP y user agent)
 */
const registrarAuditoria = async (
  id_usuario,
  accion,
  entidad,
  id_entidad,
  detalles = {},
  req = null
) => {
  try {
    const ip_address = req?.ip || req?.connection?.remoteAddress || null;
    const user_agent = req?.get("user-agent") || null;

    await pool.query(
      `INSERT INTO audit_log (id_usuario, accion, entidad, id_entidad, detalles, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_usuario,
        accion,
        entidad,
        id_entidad,
        JSON.stringify(detalles),
        ip_address,
        user_agent,
      ]
    );

    logger.info(`[AUDIT] ${accion}`, {
      id_usuario,
      entidad,
      id_entidad,
      ip: ip_address,
    });
  } catch (error) {
    logger.error("Error al registrar auditoría:", {
      error: error.message,
      accion,
      id_usuario,
    });
  }
};

/**
 * Obtiene el log de auditoría con filtros
 * @param {object} filtros - Filtros de búsqueda
 * @returns {Promise<Array>} - Array de registros de auditoría
 */
const obtenerLogAuditoria = async (filtros = {}) => {
  try {
    let query = `
      SELECT 
        a.id_audit,
        a.id_usuario,
        CONCAT(p.nombres, ' ', p.apellido_paterno) as usuario_nombre,
        r.nombre as rol,
        a.accion,
        a.entidad,
        a.id_entidad,
        a.detalles,
        a.ip_address,
        a.fecha_hora
      FROM audit_log a
      LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
      LEFT JOIN persona p ON p.id_persona = u.id_persona
      LEFT JOIN rol r ON r.id_rol = u.id_rol
      WHERE 1=1
    `;

    const params = [];

    if (filtros.id_usuario) {
      query += " AND a.id_usuario = ?";
      params.push(filtros.id_usuario);
    }

    if (filtros.accion) {
      query += " AND a.accion = ?";
      params.push(filtros.accion);
    }

    if (filtros.entidad) {
      query += " AND a.entidad = ?";
      params.push(filtros.entidad);
    }

    if (filtros.fecha_desde) {
      query += " AND a.fecha_hora >= ?";
      params.push(filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query += " AND a.fecha_hora <= ?";
      params.push(filtros.fecha_hasta);
    }

    query += " ORDER BY a.fecha_hora DESC LIMIT ?";
    params.push(filtros.limit || 100);

    const [rows] = await pool.query(query, params);

    // Parsear JSON de detalles
    return rows.map((row) => ({
      ...row,
      detalles:
        typeof row.detalles === "string"
          ? JSON.parse(row.detalles)
          : row.detalles,
    }));
  } catch (error) {
    logger.error("Error al obtener log de auditoría:", {
      error: error.message,
    });
    return [];
  }
};

/**
 * Registra un intento de login
 */
const registrarIntentoLogin = async (username, successful, req) => {
  try {
    const ip_address = req?.ip || req?.connection?.remoteAddress || null;
    const user_agent = req?.get("user-agent") || null;

    await pool.query(
      `INSERT INTO login_attempts (username, successful, ip_address, user_agent)
       VALUES (?, ?, ?, ?)`,
      [username, successful, ip_address, user_agent]
    );

    if (!successful) {
      logger.warn(`Intento de login fallido: ${username}`, { ip: ip_address });
    }
  } catch (error) {
    logger.error("Error al registrar intento de login:", {
      error: error.message,
    });
  }
};

/**
 * Obtiene estadísticas de intentos de login
 */
const obtenerEstadisticasLogin = async (dias = 7) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        DATE(fecha_intento) as fecha, 
        COUNT(*) as total,
        SUM(CASE WHEN successful = 1 THEN 1 ELSE 0 END) as exitosos,
        SUM(CASE WHEN successful = 0 THEN 1 ELSE 0 END) as fallidos
       FROM login_attempts
       WHERE fecha_intento >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(fecha_intento)
       ORDER BY fecha DESC`,
      [dias]
    );

    return rows;
  } catch (error) {
    logger.error("Error al obtener estadísticas de login:", {
      error: error.message,
    });
    return [];
  }
};

// Acciones críticas predefinidas
const ACCIONES_AUDITORIA = {
  // Proyectos
  SUBIR_PROYECTO: "SUBIR_PROYECTO",
  APROBAR_PROYECTO_FORMATO: "APROBAR_PROYECTO_FORMATO",
  OBSERVAR_PROYECTO_FORMATO: "OBSERVAR_PROYECTO_FORMATO",
  APROBAR_ASESOR: "APROBAR_ASESOR",
  RECHAZAR_ASESOR: "RECHAZAR_ASESOR",
  ASIGNAR_JURADOS: "ASIGNAR_JURADOS",
  APROBAR_PROYECTO_ASESOR: "APROBAR_PROYECTO_ASESOR",
  OBSERVAR_PROYECTO_ASESOR: "OBSERVAR_PROYECTO_ASESOR",
  APROBAR_PROYECTO_JURADO: "APROBAR_PROYECTO_JURADO",
  OBSERVAR_PROYECTO_JURADO: "OBSERVAR_PROYECTO_JURADO",

  // Borradores
  SUBIR_BORRADOR: "SUBIR_BORRADOR",
  APROBAR_BORRADOR_COORD: "APROBAR_BORRADOR_COORD",
  APROBAR_BORRADOR_ASESOR: "APROBAR_BORRADOR_ASESOR",
  APROBAR_BORRADOR_JURADO: "APROBAR_BORRADOR_JURADO",

  // Sustentación
  PROGRAMAR_SUSTENTACION: "PROGRAMAR_SUSTENTACION",
  GENERAR_RESOLUCION: "GENERAR_RESOLUCION",
  REGISTRAR_RESULTADO_SUSTENTACION: "REGISTRAR_RESULTADO_SUSTENTACION",
  GENERAR_ACTA: "GENERAR_ACTA",

  // Seguridad
  LOGIN_EXITOSO: "LOGIN_EXITOSO",
  LOGIN_FALLIDO: "LOGIN_FALLIDO",
  HABILITAR_2FA: "HABILITAR_2FA",
  DESHABILITAR_2FA: "DESHABILITAR_2FA",
  CAMBIAR_PASSWORD: "CAMBIAR_PASSWORD",
};

module.exports = {
  registrarAuditoria,
  obtenerLogAuditoria,
  registrarIntentoLogin,
  obtenerEstadisticasLogin,
  ACCIONES_AUDITORIA,
};
