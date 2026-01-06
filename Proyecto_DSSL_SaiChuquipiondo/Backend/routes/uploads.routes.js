const express = require("express");
const router = express.Router();

// Detectar si estamos en producción
const isProduction = process.env.NODE_ENV === "production";

// Servir archivos desde Cloudinary o filesystem local
router.get("/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;

  if (isProduction) {
    // En producción, redirigir a Cloudinary
    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${folder}/${filename}`;
    return res.redirect(cloudinaryUrl);
  } else {
    // En desarrollo, servir desde filesystem local
    const path = require("path");
    const filePath = path.join(__dirname, "..", "uploads", folder, filename);
    return res.sendFile(filePath);
  }
});

module.exports = router;
