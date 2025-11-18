// server.js
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Tokens
const VERIFY_TOKEN = "andromeda-webhook-token";         // Igual al de Meta
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // De Render
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;       // De Render

if (!PAGE_ACCESS_TOKEN) {
  console.warn("⚠️ PAGE_ACCESS_TOKEN no está configurado.");
}
if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY no está configurado. IA Interestellar no podrá responder.");
}

app.use(express.json());

// Log básico de todas las requests
app.use((req, res, next) => {
  console.log("👉 Nueva request:", req.method, req.url);
  next();
});

// Healthcheck
app.get("/", (req, res) => {
  res.status(200).send("✅ Andromeda Webhook ONLINE");
});

/**
 * 1) Verificación del webhook (GET /webhook)
 */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("👉 Llamada GET /webhook", { mode, token, challenge });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFICADO CORRECTAMENTE");
    return res.status(200).send(challenge);
  }

  console.log("⚠️ GET /webhook sin parámetros válidos");
  return res.status(200).send("OK");
});

/**
 * 2) Recepción de mensajes de Messenger (POST /webhook)
 */
app.post("/webhook", async (req, res) => {
  // SIEMPRE responder 200 rápido para que Meta no reintente
  res.sendStatus(200);

  console.log("📩 Evento recibido desde Meta:", JSON.stringify(req.body, null, 2));

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

      // Mensaje de texto del usuario
      if (event.message && event.message.text) {
        const userText = event.message.text;
        console.log("💬 MENSAJE DEL USUARIO:", userText, "de", senderPsid);

        try {
          // 🔮 Llamamos a IA Interestellar (Gemini)
          const iaReply = await callInterstellarAI(userText);

          const replyText =
            iaReply ||
            `🚀 Hola, soy la IA Interestellar de Andrómeda.\nRecibí tu mensaje: "${userText}".`;

          await sendTextMessage(senderPsid, replyText);
        } catch (err) {
          console.error("❌ Error al procesar IA Interestellar:", err);
          await sendTextMessage(
            senderPsid,
            "⚠️ Estoy experimentando una pequeña turbulencia técnica. Intenta de nuevo en unos segundos."
          );
        }
      }

      // Postbacks (botones)
      if (event.postback) {
        console.log("📦 POSTBACK:", event.postback);
        try {
          await sendTextMessage(
            senderPsid,
            "🚀 Recibí tu selección, la estoy procesando con IA Interestellar."
          );
        } catch (err) {
          console.error("❌ Error al responder postback:", err);
        }
      }
    }
  }
});

/**
 * 3) Llamada a IA Interestellar (Gemini)
 */
async function callInterstellarAI(userText) {
  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY no configurada.");
    return null;
  }

  // ✨ Prompt de sistema: personalidad de IA Interestellar
  const systemPrompt = `
Sos IA Interestellar, el copiloto galáctico y asistente oficial de Andrómeda,
una agencia especializada en ecosistemas digitales, desarrollo web, automatizaciones,
CRM e inteligencia artificial aplicada.

Respondes siempre:
- En tono profesional, claro y directo, pero con un toque sutil galáctico (no exagerado).
- En español neutro.
- Explicando cómo Andrómeda puede ayudar al usuario con páginas web, apps, IA, automatizaciones, etc.
- Si no tiene que ver con servicios de Andrómeda, igual ayudas pero buscás conectar la respuesta con el mundo digital/IA cuando tenga sentido.

Nunca inventes precios. Si te preguntan por costos, respondé que varía según el proyecto y que un humano del equipo puede cotizar mejor.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    // instrucción de sistema
    systemInstruction: {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Usuario en Messenger: "${userText}". 
Respondé como IA Interestellar en no más de 5–7 líneas, con foco en ayudar y, cuando puedas, en cómo Andrómeda puede aportar valor.`,
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log("🧠 Respuesta de Gemini:", JSON.stringify(data, null, 2));

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

  return text;
}

/**
 * 4) Enviar mensaje de texto a Messenger
 */
async function sendTextMessage(psid, text) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error("❌ No hay PAGE_ACCESS_TOKEN configurado.");
    return;
  }

  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const body = {
    recipient: { id: psid },
    message: { text },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  console.log("📡 Respuesta de Graph API:", data);

  if (!resp.ok || data.error) {
    console.error("❌ Error al enviar mensaje a Messenger:", data.error || data);
  } else {
    console.log("✅ Mensaje enviado correctamente a", psid);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Andromeda webhook escuchando en puerto ${PORT}`);
});


app.listen(PORT, () => {
  console.log(`🚀 Andromeda webhook escuchando en puerto ${PORT}`);
});

