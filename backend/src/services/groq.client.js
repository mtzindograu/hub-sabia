/**
 * OpenRouter Client Singleton
 * Reúne a configuração do SDK para ser compartilhada entre serviços.
 */

import Groq from "groq-sdk";

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  throw new Error("Missing GROQ_API_KEY. Por favor, configure backend/.env.");
}

export const groqClient = new Groq({
  apiKey: API_KEY,
});

export default {
  groqClient,
};
