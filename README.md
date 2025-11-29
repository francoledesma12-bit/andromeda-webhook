# 🤖 Andromeda: Omnichannel AI Assistant Webhook (Meta API)

## Project Overview
This project is the core backend for an Omnichannel AI Assistant, designed to provide 24/7, consistent customer service across all Meta platforms (WhatsApp, Instagram, Messenger). It serves as a proof-of-concept demonstrating robust integration and scalable AI orchestration for business automation.

**Goal:** To automate customer interactions, reduce staff workload, and ensure brand consistency across all communication channels.

## Key Features & Achievements
* **Omnichannel Integration:** Seamlessly handles webhooks and routing for **WhatsApp, Instagram, and Messenger** via the Meta API.
* **24/7 Availability:** Designed for continuous service with high resilience.
* **Scalable Architecture:** Built on Node.js and Firebase Functions (or similar serverless approach) to handle high volumes of concurrent requests.
* **Consistent Response Engine:** Ensures the AI (LLM) delivers a unified voice regardless of the platform used by the customer.

## Technology Stack
* **Backend Runtime:** Node.js
* **API Framework:** Express.js (or similar, depending on the server structure)
* **Key Integrations:** Meta APIs (WhatsApp Business API, Messenger Platform), Gemini/LLM Integration (or similar).
* **Deployment:** Google Cloud / Firebase Functions (Suggested for serverless scalability).

## Setup & Local Run (For Developers)

1.  Clone the repository: `git clone https://aws.amazon.com/es/what-is/repo/`
2.  Install dependencies: `npm install`
3.  Set up environment variables: Create a `.env` file with your `META_APP_SECRET`, `VERIFY_TOKEN`, etc.
4.  Run the server: `node server.js`
5.  Set up your tunneling service (e.g., ngrok) to expose the local server to Meta's webhooks.

---
*Created by: Franco Ledesma | Full Stack Developer & AI Solutions Architect* Andromeda.-

## Diagrama de Arquitectura de la Solución
![Circuito del Asistente de IA Omnicanal] (circuito iA.png)
