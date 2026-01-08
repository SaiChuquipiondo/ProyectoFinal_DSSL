const multer = require("multer");
const path = require("path");
const fs = require("fs");

const isProduction = process.env.NODE_ENV === "production";

let storage;

if (isProduction) {
  const cloudinary = require("../config/cloudinary");
  const { CloudinaryStorage } = require("multer-storage-cloudinary");

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "borradores",
      public_id: (req, file) => `borrador_${Date.now()}`,
      format: async () => "pdf",
      access_mode: "public",
    },
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "..", "uploads", "borradores");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".pdf";
      const nombre = `borrador_${Date.now()}${ext}`;
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

const uploadBorrador = multer({ storage, fileFilter }).single("archivo");

module.exports = uploadBorrador;
