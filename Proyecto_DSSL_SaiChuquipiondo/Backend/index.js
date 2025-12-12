const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos subidos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/estudiante", require("./routes/estudiante.routes"));
app.use("/api/asesor", require("./routes/asesores.routes"));
app.use("/api/jurado", require("./routes/jurados.routes"));
app.use("/api/coordinacion", require("./routes/coordinacion.routes"));
app.use("/api/notificaciones", require("./routes/notificacion.routes"));
app.use("/api/sustentacion", require("./routes/sustentacion.routes"));

// ... auth, otros módulos, etc.

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor escuchando en el puerto", PORT);
});
