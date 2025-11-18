// server.js
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Token de verificación (igual al que pusiste en Facebook)
const VERIFY_TOKEN = "andromeda-webhook-token";

// 🔐 Token largo de la página (variable de entorno en Render)
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

if (!PAGE_ACCESS_TOKEN) {
  console.warn("⚠️ PAGE_ACCESS_TOKEN no está configurado. No podré enviar mensajes a Messenger.");
}

app.use(express.json());

// Log de toda request que entra
app.use((req, res, next) => {
  console.log("👉 Nueva request:", req.method, req.url);
  next();
});

// Comprobación rápida
app.get("/", (req, res) => {
  res.status(200).send("✅ Andromeda Webhook ONLINE");
});

// ✅ Verificación del webhook (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("👉 Llamada GET /webhook", { mode, token, challenge });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFICADO CORRECTAMENTE");
    return res.status(200).send(challenge);
  }

  // Para cualquier otro GET, devolvemos 200 para que no se queje
  console.log("⚠️ GET /webhook sin parámetros válidos");
  return res.status(200).send("OK");
});

// 🔄 Recepción de mensajes (POST)
app.post("/webhook", async (req, res) => {
  console.log("📩 Evento recibido desde Meta (POST /webhook):", JSON.stringify(req.body, null, 2));

  // Siempre responder 200 rápido
  res.sendStatus(200);

  const body = req.body;
  if (body.object !== "page") {
    console.log("ℹ️ body.object no es 'page', se ignora");
    return;
  }

  for (const entry of body.entry || []) {
    const events = entry.messaging || [];
    for (const event of events) {
      const senderPsid = event.sender && event.sender.id;
      if (!senderPsid) continue;

      if (event.message && event.message.text) {
        const userText = event.message.text;
        console.log("💬 MENSAJE DEL USUARIO:", userText, "de", senderPsid);

        const replyText =
          `🚀 Hola, soy la IA Interestellar de Andrómeda.\n` +
          `Recibí tu mensaje: "${userText}".`;

        try {
          await sendTextMessage(senderPsid, replyText);
        } catch (err) {
          console.error("❌ Error al enviar respuesta:", err);
        }
      }

      if (event.postback) {
        console.log("📦 POSTBACK:", event.postback);
        try {
          await sendTextMessage(
            senderPsid,
            "🚀 Recibí tu selección, la estoy procesando."
          );
        } catch (err) {
          console.error("❌ Error al enviar respuesta a postback:", err);
        }
      }
    }
  }
});

// 📨 Enviar mensaje a Messenger
async function sendTextMessage(psid, text) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error("❌ No hay PAGE_ACCESS_TOKEN configurado, no puedo enviar mensajes.");
    return;
  }

  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const body = {
    recipient: { id: psid },
    message: { text },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  console.log("📡 Respuesta de Graph API:", data);

  if (!response.ok || data.error) {
    console.error("❌ Error al enviar mensaje a Messenger:", data.error || data);
  } else {
    console.log("✅ Mensaje enviado correctamente a", psid);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Andromeda webhook escuchando en puerto ${PORT}`);
});
