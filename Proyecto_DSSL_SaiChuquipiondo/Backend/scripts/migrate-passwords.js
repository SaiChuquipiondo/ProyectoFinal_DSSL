/**
 * Script para migrar todas las contraseñas en texto plano a bcrypt
 *
 * IMPORTANTE: Este script debe ejecutarse SOLO UNA VEZ para migrar
 * las contraseñas existentes de texto plano a hash bcrypt.
 *
 * Después de la ejecución, TODAS las contraseñas estarán hasheadas.
 *
 * USO: node scripts/migrate-passwords.js
 */

const bcrypt = require("bcryptjs");
const pool = require("../config/database");
require("dotenv").config();

async function migratePasswords() {
  console.log("🔄 Iniciando migración de contraseñas a bcrypt...\n");

  try {
    // Obtener todos los usuarios con contraseñas en texto plano
    const [users] = await pool.query(
      "SELECT id_usuario, username, password_hash FROM usuario WHERE password_hash NOT LIKE '$2%'"
    );

    if (users.length === 0) {
      console.log("✅ No hay contraseñas por migrar. Todas están hasheadas.");
      process.exit(0);
    }

    console.log(
      `📊 Se encontraron ${users.length} contraseñas en texto plano para migrar.\n`
    );

    let migrated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Hashear la contraseña en texto plano
        const hashedPassword = await bcrypt.hash(user.password_hash, 10);

        // Actualizar en la base de datos
        await pool.query(
          "UPDATE usuario SET password_hash = ? WHERE id_usuario = ?",
          [hashedPassword, user.id_usuario]
        );

        migrated++;
        console.log(`✅ Usuario: ${user.username} - Migrado`);
      } catch (error) {
        failed++;
        console.error(`❌ Usuario: ${user.username} - Error: ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Migración completada:`);
    console.log(`   - Exitosas: ${migrated}`);
    console.log(`   - Fallidas: ${failed}`);
    console.log(`   - Total: ${users.length}`);
    console.log("=".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error en la migración:", error);
    process.exit(1);
  }
}

migratePasswords();
