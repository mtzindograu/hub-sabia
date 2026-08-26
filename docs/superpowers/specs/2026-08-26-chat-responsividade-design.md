# Responsividade da área de resposta do Chat — Design

## Objetivo

Corrigir exclusivamente a responsividade visual da conversa do HubSabiá em `frontend/src/pages/Chat.vue` e, se necessário, `frontend/src/components/MessageBubble.vue`, preservando o visual atual e toda a lógica existente.

## Escopo

A mudança cobre apenas a área em que aparecem mensagens, respostas da IA, campo de digitação, botão de envio e rolagem da conversa. Não altera backend, créditos, planos, providers, RAG, fluxo de envio ou outras páginas.

## Comportamento responsivo

- Desktop e notebook mantêm o comportamento e a aparência atuais.
- Em telas pequenas, a sidebar inicia recolhida e a conversa ocupa toda a largura disponível.
- O botão existente continua abrindo a sidebar; o fechamento existente continua funcionando.
- A grade e os flex containers devem permitir encolhimento real (`min-width: 0` / `minmax(0, 1fr)`) para evitar overflow horizontal.
- A área da conversa conserva scroll vertical próprio e não cria scroll horizontal.
- Mensagens, fontes, metadados, URLs, identificadores longos e conteúdo semelhante devem quebrar dentro da largura disponível.
- O campo de digitação deve se adaptar à largura do viewport; o botão permanece visível e não encolhe.
- Padding, margens, limites de largura e altura da conversa reduzem-se apenas nos breakpoints necessários.

## Abordagem

Aplicar correções CSS localizadas nos estilos scoped existentes. Usar media queries somente para telas pequenas, mantendo os valores atuais fora delas. Não adicionar componente, dependência ou lógica de negócio.

## Verificação

Validar visualmente e estruturalmente a área do chat em 1440px, 1024px, 768px, 430px e 375px, incluindo mensagens longas e o campo de envio. Executar `npm run build` dentro de `frontend` e registrar o resultado.
