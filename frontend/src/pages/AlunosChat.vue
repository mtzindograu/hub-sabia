<template>
  <DashboardLayout page-title="Chat Alunos">
    <div class="chat-alunos-page">
      <section class="stub-banner" aria-label="Status do Chat Alunos">
        <div class="banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <div><strong>Chat entre alunos</strong><span>Um espaço para trocar experiências e dúvidas com outros estudantes.</span></div>
        <span class="badge-new">Em breve</span>
      </section>

      <div class="messages-area" ref="messagesContainer">
        <section class="stub-hero" aria-labelledby="students-chat-title">
          <div class="welcome-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
          <p class="eyebrow">Prévia do recurso</p>
          <h1 id="students-chat-title">Converse com quem também está pesquisando.</h1>
          <p>Esta área ainda é um stub. Em breve você poderá compartilhar descobertas, perguntar sobre prazos e encontrar apoio de outros alunos.</p>
          <router-link to="/chat" class="btn btn-secondary">Enquanto isso, use o Chat IA <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></router-link>
        </section>

        <section class="mock-messages" aria-label="Exemplo de conversa">
          <div class="mock-label"><span></span> Exemplo de como será <span></span></div>
          <div v-for="(msg, i) in mockMessages" :key="i" class="message-row" :class="msg.type">
            <div class="message-avatar">{{ msg.avatar }}</div>
            <div class="message-bubble" :class="msg.type"><div class="msg-sender">{{ msg.sender }} <span>· {{ msg.time }}</span></div><div class="msg-text">{{ msg.text }}</div></div>
          </div>
        </section>
      </div>

      <div class="input-area">
        <div class="input-wrapper disabled"><input type="text" placeholder="O chat será liberado em breve..." disabled aria-label="Mensagem (indisponível)" /><button class="send-btn" disabled aria-label="Enviar mensagem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>
      </div>
    </div>
   </DashboardLayout>
 </template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'

const messagesContainer = ref(null)

const mockMessages = [
  {
    type: 'other',
    avatar: 'MA',
    sender: 'Maria Silva',
    time: '10:30',
    text: 'Alguém sabe qual o prazo de inscrição para o edital de bolsas?',
  },
  {
    type: 'other',
    avatar: 'JP',
    sender: 'João Pereira',
    time: '10:35',
    text: 'Oi Maria! Pelo que eu vi, as inscrições vão até o dia 27 de fevereiro. Mas confirma no edital!',
  },
  {
    type: 'other',
    avatar: 'AL',
    sender: 'Ana Lima',
    time: '10:40',
    text: 'Eu me inscrevi semana passada! Os documentos necessários são basicamente comprovante de matrícula e RG.',
  },
]

onMounted(() => {
  // Future: load real messages
})
</script>

<style scoped>
.chat-alunos-page { display: flex; flex-direction: column; height: calc(100vh - 76px); max-height: calc(100vh - 76px); }
.stub-banner { display: flex; align-items: center; gap: 0.8rem; padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--color-primary-100); background: var(--color-primary-50); color: var(--color-primary-700); }
.banner-icon { width: 32px; height: 32px; display: grid; place-items: center; flex-shrink: 0; border-radius: var(--radius-lg); background: var(--color-surface); color: var(--color-primary-600); }
.banner-icon svg { width: 18px; height: 18px; }
.stub-banner div:nth-child(2) { display: flex; flex-direction: column; gap: 0.1rem; }
.stub-banner strong { font-size: 0.8rem; font-weight: 800; }
.stub-banner span:not(.badge-new) { color: var(--color-text-secondary); font-size: 0.74rem; }
.badge-new { margin-left: auto; padding: 0.25rem 0.6rem; border-radius: var(--radius-full); background: var(--color-primary-600); color: var(--color-text-inverse); font-size: 0.67rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
.messages-area { flex: 1; overflow-y: auto; padding: 2rem 1.5rem; background: var(--color-bg); }
.stub-hero { max-width: 620px; margin: 0 auto 2.5rem; padding: 2.5rem 1.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-2xl); background: var(--color-surface); box-shadow: var(--shadow-sm); text-align: center; }
.welcome-icon { width: 58px; height: 58px; display: grid; place-items: center; margin: 0 auto 1rem; border-radius: var(--radius-xl); background: var(--color-primary-50); color: var(--color-primary-700); }
.welcome-icon svg { width: 29px; height: 29px; }
.eyebrow { margin: 0 0 0.55rem; color: var(--color-primary-700); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
.stub-hero h1 { max-width: 470px; margin: 0 auto 0.7rem; color: var(--color-text); font-family: var(--font-display); font-size: clamp(1.7rem, 4vw, 2.35rem); font-weight: 600; letter-spacing: -0.04em; line-height: 1.08; }
.stub-hero p:not(.eyebrow) { max-width: 480px; margin: 0 auto 1.25rem; color: var(--color-text-secondary); font-size: 0.86rem; line-height: 1.7; }
.stub-hero .btn { display: inline-flex; align-items: center; gap: 0.45rem; }
.stub-hero .btn svg { width: 16px; height: 16px; }
.mock-messages { max-width: 620px; margin: 0 auto; padding-bottom: 0.5rem; opacity: 0.82; }
.mock-label { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem; color: var(--color-text-muted); font-size: 0.67rem; font-weight: 800; letter-spacing: 0.1em; text-align: center; text-transform: uppercase; }
.mock-label span { height: 1px; flex: 1; background: var(--color-border); }
.message-row { display: flex; align-items: flex-end; gap: 0.6rem; margin-bottom: 0.8rem; }
.message-avatar { width: 30px; height: 30px; display: grid; place-items: center; flex-shrink: 0; border-radius: var(--radius-full); background: var(--color-primary-600); color: var(--color-text-inverse); font-size: 0.64rem; font-weight: 800; }
.message-bubble { max-width: 78%; padding: 0.7rem 0.9rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm); background: var(--color-surface); }
.msg-sender { margin-bottom: 0.22rem; color: var(--color-primary-700); font-size: 0.67rem; font-weight: 800; }
.msg-sender span { color: var(--color-text-muted); font-weight: 500; }
.msg-text { color: var(--color-text-secondary); font-size: 0.77rem; line-height: 1.5; }
.input-area { padding: 0.9rem 1.25rem; border-top: 1px solid var(--color-border); background: var(--color-surface); }
.input-wrapper { display: flex; align-items: center; gap: 0.7rem; max-width: 760px; margin: 0 auto; padding: 0.45rem 0.55rem 0.45rem 0.9rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface-2); }
.input-wrapper.disabled { opacity: 0.62; }
.input-wrapper input { width: 100%; flex: 1; padding: 0.4rem 0; border: 0; outline: 0; background: transparent; color: var(--color-text-muted); font: inherit; font-size: 0.82rem; }
.input-wrapper input::placeholder { color: var(--color-text-muted); }
.send-btn { width: 34px; height: 34px; display: grid; place-items: center; flex-shrink: 0; border: 0; border-radius: var(--radius-lg); background: var(--color-gray-300); color: var(--color-text-inverse); cursor: not-allowed; }
.send-btn svg { width: 17px; height: 17px; }
@media (max-width: 600px) { .messages-area { padding: 1.25rem 0.9rem; } .stub-hero { padding: 1.75rem 1rem; margin-bottom: 2rem; } .stub-banner { padding-inline: 0.9rem; } .stub-banner span:not(.badge-new) { display: none; } .message-bubble { max-width: calc(100% - 2.5rem); } }
</style>
