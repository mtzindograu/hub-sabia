/**
 * Seed de demonstração: cria admin + usuário de teste usando o modelo REAL.
 * Env: SEED_ADMIN_PASSWORD, SEED_USER_PASSWORD (sem hardcode de credenciais).
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../models/User.js";
import { hashSenha } from "../services/auth.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não configurada em backend/.env");

  await mongoose.connect(uri);

  const upsert = (email, role, nome) =>
    User.updateOne(
      { email },
      { $setOnInsert: { email, role, nome } },
      { upsert: true },
    );

  await upsert("admin@hubsabia.com", "admin", "Administrador");
  await upsert("user@hubsabia.com", "user", "Usuário Teste");

  const admin = await User.findOne({ email: "admin@hubsabia.com" });
  const user = await User.findOne({ email: "user@hubsabia.com" });
  admin.senha_hash = await hashSenha(process.env.SEED_ADMIN_PASSWORD || "troque-esta-senha-1");
  user.senha_hash = await hashSenha(process.env.SEED_USER_PASSWORD || "troque-esta-senha-2");
  await Promise.all([admin.save(), user.save()]);

  console.log("Seed ok: admin@hubsabia.com / user@hubsabia.com (senhas via SEED_*_PASSWORD)");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
