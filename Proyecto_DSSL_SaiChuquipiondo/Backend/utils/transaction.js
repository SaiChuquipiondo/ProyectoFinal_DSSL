const logger = require("../config/logger");

/**
 * Ejecuta una función dentro de una transacción de base de datos
 * Si la función falla, hace rollback automático
 *
 * @param {Object} pool - Pool de conexiones de MySQL
 * @param {Function} callback - Función async que recibe la conexión
 * @returns {Promise} - Resultado de la función callback
 */
async function withTransaction(pool, callback) {
  const connection = await pool.getConnection();

  try {
    // Iniciar transacción
    await connection.beginTransaction();

    logger.debug("Transacción iniciada");

    // Ejecutar la función callback
    const result = await callback(connection);

    // Commit si todo fue exitoso
    await connection.commit();
    logger.debug("Transacción completada exitosamente");

    return result;
  } catch (error) {
    // Rollback en caso de error
    await connection.rollback();
    logger.error("Transacción revertida debido a error:", {
      error: error.message,
      stack: error.stack,
    });

    throw error;
  } finally {
    // Liberar la conexión de vuelta al pool
    connection.release();
  }
}

/**
 * Ejemplo de uso:
 *
 * const result = await withTransaction(pool, async (connection) => {
 *   // Múltiples operaciones de BD aquí
 *   await connection.query("INSERT INTO ...", [params]);
 *   await connection.query("UPDATE ...", [params]);
 *
 *   // Si algo falla, se hace rollback automático
 *   return someValue;
 * });
 */

module.exports = { withTransaction };
