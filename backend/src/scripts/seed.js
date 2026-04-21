/**
 * Seed Script - Cria usuários iniciais para teste
 * Executar com: node --env-file=.env src/scripts/seed.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env do diretório backend
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hubsabia';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  senha_hash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  nome: { type: String, default: '' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  try {
    console.log('[SEED] Conectando ao MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[SEED] Conectado!');

    // Verificar se já existem usuários
    const existingUsers = await User.countDocuments();
    console.log(`[SEED] Usuários existentes: ${existingUsers}`);

    // Criar admin se não existir
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        email: 'admin@hubsabia.com',
        senha_hash: hashedPassword,
        role: 'admin',
        nome: 'Administrador',
      });
      await admin.save();
      console.log('[SEED] ✅ Admin criado: admin@hubsabia.com / admin123');
    } else {
      console.log('[SEED] Admin já existe:', existingAdmin.email);
    }

    // Criar usuário comum se não existir
    const existingUser = await User.findOne({ email: 'usuario@hubsabia.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('user123', 10);
      const user = new User({
        email: 'usuario@hubsabia.com',
        senha_hash: hashedPassword,
        role: 'user',
        nome: 'Usuário Comum',
      });
      await user.save();
      console.log('[SEED] ✅ Usuário criado: usuario@hubsabia.com / user123');
    } else {
      console.log('[SEED] Usuário comum já existe:', existingUser.email);
    }

    // Listar todos os usuários
    const allUsers = await User.find().select('-senha_hash');
    console.log('\n[SEED] Todos os usuários:');
    allUsers.forEach(u => {
      console.log(`  - ${u.email} | role: ${u.role} | nome: ${u.nome || '—'}`);
    });

    console.log('\n[SEED] ✅ Seed finalizado!');
  } catch (error) {
    console.error('[SEED] Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[SEED] Desconectado do MongoDB');
    process.exit(0);
  }
}

seed();
