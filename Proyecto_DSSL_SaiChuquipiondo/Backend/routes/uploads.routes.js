const express = require("express");
const router = express.Router();

const isProduction = process.env.NODE_ENV === "production";

router.get("/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;

  if (isProduction) {
    const finalFilename = filename.toLowerCase().endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;
    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${folder}/${finalFilename}`;
    return res.redirect(cloudinaryUrl);
  } else {
    const path = require("path");
    const filePath = path.join(__dirname, "..", "uploads", folder, filename);
    return res.sendFile(filePath);
  }
});

module.exports = router;
