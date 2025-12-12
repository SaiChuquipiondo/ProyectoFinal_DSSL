const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = path.join(__dirname, "../uploads/solicitudes");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "solicitud_" + Date.now() + ext);
  },
});

module.exports = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().includes(".pdf"))
      return cb(new Error("Solo PDF"));
    cb(null, true);
  },
}).single("archivo");
