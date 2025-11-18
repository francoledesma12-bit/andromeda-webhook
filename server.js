// server.js
import express from "express";
import cors from "cors";

const app = express();

// 🔐 Token que tiene que coincidir con lo que pones en Meta
const VERIFY_TOKEN = "andromeda-webhook-token";

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Ruta básica para ver si el server responde
app.get("/", (req, res) => {
  res.send("Andromeda webhook OK");
});

// ✅ Verificación de webhook (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🛰️ Verificación webhook:", {
    mode,
    token,
    challenge,
  });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    // Si todo coincide, devolvemos el challenge
    return res.status(200).send(challenge);
  }

  console.log("❌ Token o modo incorrecto");
  return res.sendStatus(403);
});

// 📩 Recepción de mensajes (POST)
app.post("/webhook", (req, res) => {
  console.log("📨 Mensaje recibido de Meta:");
  console.log(JSON.stringify(req.body, null, 2));

  // Siempre respondemos 200 para que Meta quede contento
  res.sendStatus(200);
});

// Arrancamos el server
app.listen(PORT, () => {
  console.log(`🚀 Andromeda webhook escuchando en puerto ${PORT}`);
});
