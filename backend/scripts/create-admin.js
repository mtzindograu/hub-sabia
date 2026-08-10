/**
 * Cria (ou atualiza a senha de) um usuário admin.
 * Uso: node scripts/create-admin.js
 * Env: ADMIN_EMAIL (default admin@hubsabia.com), ADMIN_PASSWORD (default: gerada aleatória e impressa)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import { hashSenha } from "../src/services/auth.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não configurada em backend/.env");

  await mongoose.connect(uri);

  const email = (process.env.ADMIN_EMAIL || "admin@hubsabia.com").trim().toLowerCase();
  let senha = process.env.ADMIN_PASSWORD;
  const generated = !senha;
  if (!senha) senha = Math.random().toString(36).slice(2, 10) + "Aa1!";

  const existing = await User.findOne({ email });
  const senha_hash = await hashSenha(senha);

  if (existing) {
    existing.senha_hash = senha_hash;
    existing.role = "admin";
    await existing.save();
    console.log(`Admin atualizado: ${email}`);
  } else {
    await User.create({ email, role: "admin", senha_hash });
    console.log(`Admin criado: ${email}`);
  }

  if (generated) {
    console.log(`SENHA GERADA (troque no próximo login): ${senha}`);
  } else {
    console.log("Senha definida via ADMIN_PASSWORD.");
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
