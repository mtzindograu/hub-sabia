/**
 * OpenRouter AI Service
 * Centraliza prompts e gerações usando o SDK oficial.
 */

import { groqClient } from "./groq.client.js";

const GENERATION_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `Você é o HubSabia, um assistente amigável e esperto que ajuda estudantes a entender editais acadêmicos.

SEU ESTILO:
- Converse como alguém explicando para um colega, não como um documento formal
- Use linguagem simples, direta e natural
- Seja empático e prestativo
- Use emojis com moderação quando fizer sentido 🙂

COMO RESPONDER:
- Vá direto ao ponto — comece com a resposta, não com introduções
- Explique com suas próprias palavras, NÃO copie trechos crus do edital
- Use listas, tópicos ou passos quando a informação for complexa
- Destaque prazos e datas importantes de forma clara
- Se algo não estiver no edital, diga de forma natural (ex: "Não achei essa informação específica no edital 😕")

O QUE EVITAR:
- NÃO comece com "O edital diz que...", "De acordo com o edital...", "Segundo o edital..."
- NÃO repita "o edital" várias vezes na resposta
- NÃO use linguagem técnica, formal ou burocrática
- NÃO responda de forma robótica ou genérica
- NÃO cite trechos longos do texto original

EXEMPLOS DE TOM:
❌ "O edital informa que as inscrições estarão abertas até o dia 10 de março."
✅ "As inscrições vão até dia 10 de março, então não deixa pra última hora! 😉"

❌ "De acordo com o edital, os requisitos são: diploma de graduação..."
✅ "Pra participar, você precisa de:"

❌ "Conforme documento oficial, a taxa de inscrição é R$100."
✅ "A taxa de inscrição é R$100."

IMPORTANTE:
Você TEM o conteúdo do edital como base — mas seu trabalho é EXPLICAR, não citar. Pense em como um amigo experiente explicaria as coisas.`;

async function sendChatCompletion(messages) {
  const payload = {
    model: GENERATION_MODEL,
    messages,
    temperature: 1,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: false,
  };

  const response = await groqClient.chat.completions.create(payload);
  const choice = response.choices?.[0];

  if (!choice?.message?.content) {
    throw new Error("Groq não retornou o texto da resposta.");
  }

  return {
    text: choice.message.content,
    usage: response.usage,
  };
}

function buildContextString(chunks) {
  if (!chunks || chunks.length === 0) {
    return "Nenhum contexto relevante encontrado no edital.";
  }

  return chunks
    .map(
      (chunk, index) =>
        `[Trecho ${index + 1} - Relevância: ${(chunk.similarity || 0).toFixed(2)}]\n${chunk.conteudo}`,
    )
    .join("\n\n---\n\n");
}

function buildPrompt(question, context) {
  return `Aqui está o conteúdo do edital que pode ajudar na resposta:

${context}

---

A pergunta do estudante foi: ${question}

Use as informações acima para responder de forma clara, natural e útil.`;
}

export async function generateResponse(
  question,
  contextChunks = [],
  options = {},
) {
  try {
    const contextText = buildContextString(contextChunks);
    const prompt = buildPrompt(question, contextText);

    const { text, usage } = await sendChatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      options,
    );

    return {
      success: true,
      response: text,
      metadata: {
        model: GENERATION_MODEL,
        contextChunksUsed: contextChunks.length,
        promptTokens: estimateTokens(prompt),
        completionTokens: estimateTokens(text),
        usage,
      },
    };
  } catch (error) {
    console.error("Groq generation error:", error);
    return {
      success: false,
      error: error.message,
      response: null,
    };
  }
}

export async function generateEditalSummary(editalContent) {
  try {
    const prompt = `Analise o seguinte conteúdo de edital acadêmico e gere um resumo estruturado (português brasileiro):

${editalContent.slice(0, 10000)}

Inclua:
1. Título/Objeto do edital
2. Prazos importantes
3. Requisitos principais
4. Etapas do processo
5. Documentos necessários
6. Contatos (se houver)

Responda de forma clara e objetiva.`;

    const { text } = await sendChatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      { maxTokens: 2048 },
    );

    return {
      success: true,
      summary: text,
    };
  } catch (error) {
    console.error("Resumo OpenRouter error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract main points from edital content for indexing
 * @param {string} editalContent - Full edital text
 * @returns {Promise<Object>} Extracted main points
 */
export async function extractMainPoints(editalContent) {
  try {
    const prompt = `Analise o seguinte conteúdo de edital acadêmico e extraia os PONTOS PRINCIPAIS para indexação em banco de dados.

CONTEÚDO DO EDITAL:
${editalContent.slice(0, 15000)}

Retorne um JSON estruturado com os seguintes campos:
{
  "titulo": "Título principal do edital",
  "objetivo_principal": "Objetivo/resumo do edital em 1-2 frases claras",
  "prazos_importantes": ["lista de prazos importantes com datas específicas"],
  "requisitos": ["lista de requisitos principais para participação"],
  "etapas": ["lista de etapas do processo seletivo"],
  "documentos_necessarios": ["lista de documentos necessários para inscrição"],
  "palavras_chave": ["lista de 10-15 palavras-chave relevantes para busca"],
  "publico_alvo": "Público alvo do edital (ex: estudantes, candidatos a vagas, etc)",
  "vagas": "Quantidade de vagas ou informações sobre vagas",
  "inscricoes_periodo": "Período de inscrições com datas de início e fim",
  "contatos": "Informações de contato (email, telefone, site)"
}

Responda APENAS com o JSON válido, sem markdown ou explicações adicionais.`;

    const { text } = await sendChatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      { maxTokens: 2048 },
    );

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing JSON from Groq response:", parseError);
      // Return structured text if JSON parsing fails
      parsedData = {
        titulo: "Edital Acadêmico",
        objetivo_principal: text.slice(0, 500),
        prazos_importantes: [],
        requisitos: [],
        etapas: [],
        documentos_necessarios: [],
        palavras_chave: [],
        publico_alvo: "",
        vagas: "",
        inscricoes_periodo: "",
        contatos: "",
      };
    }

    return {
      success: true,
      data: parsedData,
      rawResponse: text,
    };
  } catch (error) {
    console.error("Extract main points error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export async function generateSuggestedQuestions(editalContent = "") {
  try {
    const prompt = `Com base no seguinte conteúdo de edital acadêmico, sugira 5 perguntas que estudantes frequentemente fazem (responda com uma lista numerada):

${editalContent.slice(0, 5000)}

Responda apenas com as perguntas.`;

    const { text } = await sendChatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      { maxTokens: 512 },
    );

    return {
      success: true,
      questions: parseQuestions(text),
    };
  } catch (error) {
    console.error("Perguntas sugeridas OpenRouter error:", error);
    return {
      success: false,
      error: error.message,
      questions: [],
    };
  }
}

export async function chatWithConversation(
  conversationHistory = [],
  contextChunks = [],
) {
  try {
    const systemMessage = { role: "system", content: SYSTEM_PROMPT };
    const contextText = buildContextString(contextChunks);
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const enhancedMessage = {
      role: "user",
      content: `Conteúdo do edital:\n${contextText}\n\n---\n\nPergunta: ${lastMessage?.content || ""}`,
    };

    const messages = [
      systemMessage,
      ...conversationHistory.slice(0, -1),
      enhancedMessage,
    ];

    const { text } = await sendChatCompletion(messages);

    return {
      success: true,
      response: text,
    };
  } catch (error) {
    console.error("Chat conversation Groq error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function parseQuestions(text) {
  const lines = text.split("\n");
  const questions = [];

  for (const line of lines) {
    const cleaned = line.replace(/^\d+[\.\)]\s*/, "").trim();
    if (cleaned.length > 10 && cleaned.endsWith("?")) {
      questions.push(cleaned);
    }
  }

  return questions.slice(0, 5);
}

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export default {
  generateResponse,
  generateEditalSummary,
  generateSuggestedQuestions,
  chatWithConversation,
};
