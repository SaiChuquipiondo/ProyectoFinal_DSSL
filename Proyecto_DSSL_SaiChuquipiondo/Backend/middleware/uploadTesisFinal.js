const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Detectar si estamos en producción
const isProduction = process.env.NODE_ENV === "production";

let storage;

if (isProduction) {
  // Usar Cloudinary en producción (Railway)
  const cloudinary = require("../config/cloudinary");
  const { CloudinaryStorage } = require("multer-storage-cloudinary");

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "tesis_final",
      format: async () => "pdf",
      public_id: (req, file) => `tesis_${Date.now()}`,
      resource_type: "raw", // Importante para PDFs
      access_mode: "public", // Hacer el archivo público
    },
  });
} else {
  // Usar filesystem en desarrollo local
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "..", "uploads", "tesis_final");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".pdf";
      const nombre = `tesis_${Date.now()}${ext}`;
      cb(null, nombre);
    },
  });
}

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Solo se permiten archivos PDF"), false);
  }
  cb(null, true);
};

module.exports = multer({ storage, fileFilter }).single("archivo");
