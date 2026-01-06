// Helper para generar URLs completas de archivos
const getFileUrl = (filename, folder = "proyectos") => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

module.exports = { getFileUrl };
