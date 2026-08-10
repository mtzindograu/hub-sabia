import geminiService, { autoDiscoverModels } from '../src/services/gemini.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  console.log("=== STARTING GEMINI SDK v2.x VERIFICATION ===\n");
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY not found in .env");
    return;
  }

  // 1. Test Model Discovery
  console.log("1. Testing Model Discovery...");
  const discoverySuccess = await autoDiscoverModels(apiKey);
  if (discoverySuccess) {
    console.log("   ✅ Models discovered and configured.");
  } else {
    console.log("   ❌ Discovery failed.");
  }

  // 2. Test API Key Validation
  console.log("\n2. Testing API Key Validation...");
  const isValid = await geminiService.validateApiKey(apiKey);
  if (isValid) {
    console.log("   ✅ API Key validated successfully.");
  } else {
    console.log("   ❌ API Key validation failed.");
  }

  // 3. Test Text Generation
  console.log("\n3. Testing Content Generation (generateResponse)...");
  const genResult = await geminiService.generateResponse("Olá, quem é você?", [], { userApiKey: apiKey });
  if (genResult.success) {
    console.log("   ✅ Generation successful.");
    console.log("   Response preview:", genResult.response.substring(0, 50) + "...");
  } else {
    console.log("   ❌ Generation failed:", genResult.error);
  }

  // 4. Test Embeddings
  console.log("\n4. Testing Embeddings (generateEmbedding)...");
  const embedResult = await geminiService.generateEmbedding("Teste de embedding", { userApiKey: apiKey });
  if (embedResult.success) {
    console.log("   ✅ Embedding successful.");
    console.log(`   Dimension: ${embedResult.dimension}, Model: ${embedResult.model}`);
  } else {
    console.log("   ❌ Embedding failed:", embedResult.error);
  }

  // 5. Test JSON Extraction
  console.log("\n5. Testing JSON Extraction (extractMainPoints)...");
  const dummyContent = "Edital de Monitoria 2026. Inscrições de 01/01 a 10/01. 10 vagas.";
  const extractResult = await geminiService.extractMainPoints(dummyContent, { userApiKey: apiKey });
  if (extractResult.success) {
    console.log("   ✅ Extraction successful.");
    console.log("   Extracted Title:", extractResult.data.titulo);
  } else {
    console.log("   ❌ Extraction failed:", extractResult.error);
  }

  console.log("\n=== VERIFICATION COMPLETE ===");
}

test().catch(err => {
  console.error("\nUNEXPECTED FATAL ERROR DURING TEST:");
  console.error(err);
});
