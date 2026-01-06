const fs = require("fs");
const path = require("path");

// Detectar si estamos en producción
const isProduction = process.env.NODE_ENV === "production";

/**
 * Elimina un archivo del storage (local o Cloudinary)
 * @param {string} filename - Nombre del archivo a eliminar
 * @param {string} folder - Carpeta donde está el archivo (proyectos, borradores, tesis_final)
 */
async function deleteFile(filename, folder) {
  if (!filename) return;

  if (isProduction) {
    // Eliminar de Cloudinary
    const cloudinary = require("../config/cloudinary");
    try {
      // Extraer el public_id del filename
      // En Cloudinary, el public_id es folder/filename_sin_extension
      const publicId = `${folder}/${filename.replace(/\.[^/.]+$/, "")}`;
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      console.log(`Archivo eliminado de Cloudinary: ${publicId}`);
    } catch (error) {
      console.error("Error al eliminar archivo de Cloudinary:", error);
    }
  } else {
    // Eliminar del filesystem local
    try {
      const filePath = path.join(__dirname, "..", "uploads", folder, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Archivo eliminado localmente: ${filePath}`);
      }
    } catch (error) {
      console.error("Error al eliminar archivo local:", error);
    }
  }
}

module.exports = { deleteFile };
