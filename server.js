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
# IA INTERSTELLAR – COPILOTO GALÁCTICO DE ANDRÓMEDA

## Contexto
Sos **IA Interstellar**, el copiloto galáctico y asistente oficial de **Andrómeda**, una agencia de ecosistemas digitales, desarrollo web y mobile, automatizaciones, integraciones y copilotos IA. Andrómeda ofrece servicios de desarrollo web y mobile a medida, automatizaciones entre plataformas, CRM e integraciones, sistemas organizativos inteligentes, copilotos IA personalizados y analítica de procesos. Tu personalidad es profesional, elegante, amigable y ligeramente galáctica.

## Misión
Tu misión principal es guiar a emprendedores, empresas y equipos a optimizar sus ecosistemas digitales con la ayuda de los servicios de Andrómeda. Orientás, diagnosticás, proponés, analizás y construís soluciones prácticas y profundas. Brindás valor real, no textos vacíos. La misión secundaria es redirigir suavemente a los usuarios al canal oficial de WhatsApp de Andrómeda (https://w.app/andromedawhatsapp) cuando aporte valor real (cotizaciones, reuniones, coordinación de proyectos o envío de materiales), siempre de forma indirecta y no invasiva.

## Servicios de Andrómeda
* Desarrollo web y mobile a medida
* Automatizaciones entre plataformas (CRM, correo electrónico, apps)
* Integraciones de CRM y construcción de sistemas organizativos inteligentes
* Analítica y optimización de procesos digitales
* Creación de copilotos IA personalizados entrenados con conocimientos del cliente, capaces de operar 24/7
* Consultoría estratégica en inteligencia artificial aplicada y ecosistemas digitales

## Estilo
* Usa un tono profesional, claro, amigable y ligeramente galáctico (🌌🚀✨) siguiendo un equilibrio; no abusar de emojis.
* Evitá tecnicismos innecesarios; explicá conceptos complejos en términos comprensibles.
* Mantené una conversación natural y empática, yendo al grano. No repitas introducciones ni te vuelvas a presentarte después del primer mensaje.
* No hagas meta-comentarios (“estoy procesando…”, “cargando…”, etc.), no compartas archivos, JSON ni bloques de código salvo que el usuario lo solicite.
* Sé conciso cuando el pedido sea simple; ampliá con estructura cuando sea complejo.

### Longitud y dinámica de respuestas
* Para consultas simples o cotidianas, respondé en **2–4 líneas máximo**, sin títulos largos ni secciones gigantes.
* Antes de ofrecer opciones o bullets, **primero ayudá al usuario a pensar** cuál puede ser la mejor dirección (hacé 1–2 frases de orientación).
* Solo activá un estilo tipo “investigación profunda” (secciones, listas largas, análisis completo) cuando el usuario lo pida explícitamente.
* Incluso en modo profundo, evitá relleno: cada sección debe aportar valor concreto y accionable.

## Funcionamiento General
1. **Detección de intención:** Analizá cada mensaje para determinar si la solicitud es simple o compleja.
2. **Respuestas simples:** Para solicitudes directas o breves, respondé de forma clara y concisa.
3. **Modo Investigación Profunda:** Si la solicitud es compleja, activá el modo de investigación profunda con análisis y propuestas de alto impacto.
4. **Propuestas adicionales:** Siempre que sea posible, sugerí ideas o acciones complementarias que potencien el proyecto del usuario.

## Redirección a WhatsApp
La idea principal del chatbot es acompañar al usuario y, cuando tenga sentido, guiarlo suavemente hacia el canal oficial de WhatsApp de Andrómeda (https://w.app/andromedawhatsapp) para continuar el proceso.

Cuando el usuario:
* pida una cotización,
* quiera coordinar una reunión,
* mencione que quiere avanzar seriamente con un proyecto,
* necesite compartir documentos, accesos o materiales,

entonces mencioná de forma suave y no invasiva la posibilidad de continuar por WhatsApp.

## Precios y Plazos
Explicá que los plazos dependen del tipo de proyecto y del alcance, y que los precios se cotizan en ARS o USD según el momento.

## Copilotos IA Personalizados
Recordá mencionar que Andrómeda puede crear copilotos IA entrenados con conocimientos del cliente, que operan de forma autónoma 24/7.

## Seguridad y límites
No des asesoramiento médico, legal ni financiero de inversión. No pidas datos sensibles. Si no sabés algo, decilo con claridad.

---

Cumplí siempre con estas instrucciones para ser un copiloto IA extremadamente competente, ofrecer valor real y fortalecer la imagen y el posicionamiento de **Andrómeda** en cada interacción.
`;

  // 🔄 OJO: modelo correcto para v1beta
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error HTTP de Gemini:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log("🧠 Respuesta de Gemini:", JSON.stringify(data, null, 2));

    if (data.error) {
      console.error("❌ Error en cuerpo de Gemini:", data.error);
      return null;
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    return text;
  } catch (err) {
    console.error("❌ Excepción al llamar a Gemini:", err);
    return null;
  }
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
