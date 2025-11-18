import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// TOKEN QUE VAS A PONER EN FACEBOOK
const VERIFY_TOKEN = "andromeda-webhook";

// WEBHOOK DE VERIFICACIÓN (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK VERIFICADO!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// WEBHOOK QUE RECIBE MENSAJES (POST)
app.post("/webhook", (req, res) => {
  console.log("EVENTO RECIBIDO:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Servidor Webhook corriendo en puerto " + PORT);
});
