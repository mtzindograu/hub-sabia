# HubSabia

Sistema de consulta a editais acadêmicos com IA (RAG). Monorepo npm workspaces:

- `frontend/` — Vue 3 + Vite (porta 5173)
- `backend/` — Node.js + Express + MongoDB (porta 3001)

## Stack

- **Frontend:** Vue 3.4, Vite 5, Vue Router 4, Axios, Tailwind (configurado, não utilizado)
- **Backend:** Node ≥ 20 (exigido pelo `@google/genai`), Express 4, Mongoose 8, JWT, bcrypt
- **IA:** Gemini (padrão) + Groq (Llama) — chaves de usuário opcionais
- **RAG:** extração de texto de PDF (pdf-parse) → chunking (~800 chars) → embeddings (Gemini ou local via Xenova) → busca híbrida (vetorial + palavras-chave) → geração de resposta

## Como rodar

Requisitos: Node ≥ 20, MongoDB local ou Atlas.

```bash
# 1. Instalar dependências (raiz)
npm install

# 2. Configurar variáveis (copiar exemplos)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Preencher: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY (opcional)

# 3. Subir backend e frontend
npm run dev
```

Acessar: frontend `http://localhost:5173` · backend `http://localhost:3001/api/health`

## Variáveis de ambiente

### backend/.env
| Variável | Obrigatória | Descrição |
|---|---|---|
| `PORT` | não | Porta (default 3001) |
| `NODE_ENV` | não | `development` / `production` |
| `MONGODB_URI` | **sim** | Connection string do MongoDB |
| `JWT_SECRET` | **sim** | Secret JWT — gere com `openssl rand -base64 32`. O backend **recusa iniciar sem ela** |
| `GEMINI_API_KEY` | não | Chave do Gemini (usada quando o usuário não tem chave própria) |
| `GROQ_API_KEY` | não | Chave do Groq (chat Llama) |
| `ANTHROPIC_API_KEY` | não | Reservado (Claude desabilitado) |
| `FRONTEND_URL` | não | Origem permitida no CORS (ex.: `http://localhost:5173`) |
| `MAX_FILE_SIZE` | não | Limite de upload em bytes (default 10MB) |
| `UPLOAD_DIR` | não | Diretório de uploads (default `uploads/`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | não | Usados pelo `npm run create-admin` |

### frontend/.env
| Variável | Descrição |
|---|---|
| `VITE_API_URL` | Base da API. Dev: `http://localhost:3001/api`; produção: `/api` (proxy Vercel) |
| `VITE_APP_NAME` | Nome do app |
| `VITE_APP_VERSION` | Versão exibida |

## Créditos e planos

- Todo usuário tem **20 créditos diários** (reset automático a cada 24h).
- Usuário pode configurar **chave própria** (Gemini/Groq) no perfil → uso ilimitado (`usingOwnApiKey.active`).
- Visitantes (sem login) usam o chat sem limite de créditos.
- Plano atual: gratuito apenas; a seleção de planos é exibida na primeira visita logada.

## Comandos úteis

```bash
npm run dev              # backend + frontend juntos
npm run build            # build do frontend (Vite)
npm test --workspace=backend   # smoke tests (node:test)
npm run create-admin --workspace=backend  # cria/atualiza admin (senha via ADMIN_PASSWORD ou gerada)
```

## Deploy

- **Backend:** Render (Node) — `npm start` roda `backend/src/server.js`. Configurar as env vars do painel (MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, FRONTEND_URL).
- **Frontend:** Vercel — build `npm run vercel:build`; `VITE_API_URL=/api` com proxy para o backend Render, ou URL direta.

## Estrutura (backend/src)

- `server.js` — entry point Express (rotas públicas de edital, CORS, errorHandler)
- `routes/` — auth, chat, edital (upload/delete), logs de erro
- `services/` — auth, credits, rag (pipeline), providers (gemini/openai/claude), chat, embedding, chunk, pdf, query-expansion
- `models/` — User, Edital (chunks+embeddings), ChatLog, Conversation, UsageLog, ErrorLog
- `middleware/` — auth (token JWT), errorHandler
