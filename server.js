const express = require("express");
const path = require("path");

const app = express();

// Servir todos los archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Para cualquier ruta no encontrada, devuelve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Puerto que Railway asigna automáticamente
const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("🚀 Servidor corriendo en el puerto " + port);
});
