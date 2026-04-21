/**
 * Query Expansion Service
 * Melhora a capacidade de busca entendendo variações de linguagem
 *
 * @description Expande perguntas com sinônimos e reformulações para aumentar
 * a chance de encontrar trechos relevantes nos editais
 */

// Mapa de sinônimos e variações para domínio acadêmico/editais
const SYNONYM_MAP = {
  // Carga horária / dedicação
  'carga horária': ['horas semanais', 'horas', 'dedicação semanal', 'carga horaria', 'horário'],
  'horas semanais': ['carga horária', 'horas', 'dedicação semanal', 'carga horaria'],
  'dedicação': ['carga horária', 'horas semanais', 'horas', 'carga horaria'],
  'dedicação semanal': ['horas semanais', 'carga horária', 'horas'],

  // Requisitos
  'requisitos': ['critérios', 'exigências', 'pré-requisitos', 'requisitos', 'obrigatório', 'necessário', 'precisa'],
  'critérios': ['requisitos', 'exigências', 'pré-requisitos'],
  'exigências': ['requisitos', 'critérios', 'obrigatório'],
  'pré-requisitos': ['requisitos', 'critérios', 'exigências'],

  // Inscrição
  'inscrição': ['inscricoes', 'cadastramento', 'registro', 'matrícula', 'matricula'],
  'inscrever': ['cadastrar', 'registrar', 'matricular'],
  'inscrições': ['inscricao', 'inscrição', 'cadastramento'],

  // Prazos
  'prazo': ['data limite', 'data final', 'até quando', 'até quando', 'deadline', 'período'],
  'período': ['prazo', 'data', 'quando', 'época', 'data inicial', 'data final'],
  'data': ['prazo', 'dia', 'quando'],

  // Documentos
  'documentos': ['papelada', 'certidão', 'certidao', 'comprovante', 'documentação', 'documentos necessarios'],
  'documentação': ['documentos', 'certidões', 'certidoes'],

  // Vagas
  'vagas': ['quantidade de vagas', 'número de vagas', 'numero de vagas', 'cotas'],

  // Seleção / Processo
  'seleção': ['selecao', 'processo seletivo', 'concurso', 'prova', 'exame'],
  'processo seletivo': ['seleção', 'selecao', 'concurso', 'etapas'],
  'prova': ['exame', 'teste', 'avaliação', 'avaliacao', 'seleção'],

  // Resultados
  'resultado': ['resultado final', 'classificação', 'classificacao', 'gabarito'],
  'classificação': ['classificacao', 'resultado', 'ranking'],

  // Bolsa / Auxílio
  'bolsa': ['auxílio', 'auxilio', 'pagamento', 'valor', 'remuneração', 'remuneracao'],
  'auxílio': ['bolsa', 'auxilio', 'assistência'],

  // Local
  'local': ['onde', 'endereço', 'endereco', 'cidade', 'instituição', 'instituicao'],

  // Quem pode participar
  'quem pode': ['elegibilidade', 'pode participar', 'pode se inscrever', 'público alvo', 'publico alvo'],
  'pode participar': ['quem pode', 'elegibilidade', 'requisitos'],
  'elegibilidade': ['quem pode', 'requisitos', 'pode participar'],

  // Dedicar / Dedicação
  'dedicar': ['dedicação', 'horas', 'tempo', 'carga horária', 'carga horaria'],
  'tempo': ['dedicação', 'horas', 'carga horária', 'carga horaria', 'duração', 'duracao'],
  'duração': ['tempo', 'período', 'duracao'],

  // Cumprir
  'cumprir': ['fazer', 'realizar', 'completar', 'executar', 'seguir'],
};

// Stopwords em português (palavras comuns que não agregam significado)
const STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas',
  'por', 'para', 'com', 'sem',
  'que', 'qual', 'quais', 'quanto', 'quanta',
  'como', 'quando', 'onde',
  'se', 'não', 'nao', 'sim',
  'e', 'ou', 'mas', 'porque', 'pois',
  'é', 'são', 'ser', 'estar', 'ter', 'haver',
  'fazer', 'ir', 'vir', 'poder', 'dever',
  'mais', 'menos', 'muito', 'pouco', 'tanto',
  'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
  'isto', 'isso', 'aquilo', 'aquele', 'aquela',
  'meu', 'minha', 'meus', 'minhas',
  'seu', 'sua', 'seus', 'suas',
  'eu', 'tu', 'ele', 'ela', 'nós', 'nos', 'vos', 'eles', 'elas',
  'me', 'te', 'lhe', 'lhes', 'nos', 'se',
  'aqui', 'ali', 'lá', 'la', 'cá', 'ca',
  'já', 'ja', 'ainda', 'só', 'so', 'apenas',
  'todo', 'toda', 'todos', 'todas', 'tudo',
  'outro', 'outra', 'outros', 'outras',
  'mesmo', 'mesma', 'mesmos', 'mesmas',
  'sobre', 'entre', 'após', 'apos', 'ante',
  'até', 'ate', 'desde', 'contra',
  'ao', 'aos', 'à', 'às',
  'será', 'serao', 'foi', 'eram', 'são', 'sao',
  'tem', 'têm', 'tinha', 'teve',
  'pode', 'podem', 'podia',
  'deve', 'devem', 'devia',
  'precisa', 'precisam', 'preciso',
  'quer', 'querem', 'queria',
  'dizer', 'falar', 'mostrar',
  'informação', 'informacao', 'informações', 'informacoes',
  'sobre', 'acerca', 'respectivo',
  'tal', 'tais',
  'bem', 'mal', 'melhor', 'pior',
]);

/**
 * Normalizar texto: lowercase, remover acentos, trim
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Extrair palavras-chave de uma pergunta (remove stopwords)
 */
export function extractKeywords(question) {
  const normalized = normalizeText(question);
  const words = normalized.split(/\s+/);
  return words.filter(w => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Expandir uma pergunta com sinônimos e variações
 * Retorna a pergunta original + variações expandidas
 */
export function expandQuery(question) {
  const normalized = normalizeText(question);
  const expansions = [question]; // Começa com a pergunta original

  // Para cada par de sinônimos, verificar se alguma variação aparece na pergunta
  for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
    const normalizedCanonical = normalizeText(canonical);

    // Se a pergunta contém o termo canônico ou algum sinônimo
    const hasCanonical = normalized.includes(normalizedCanonical);
    const hasSynonym = synonyms.some(syn => normalized.includes(normalizeText(syn)));

    if (hasCanonical || hasSynonym) {
      // Adiciona variações à expansão
      const allVariations = [canonical, ...synonyms];
      for (const variation of allVariations) {
        if (!expansions.includes(variation) && variation !== question) {
          expansions.push(variation);
        }
      }
    }
  }

  return {
    original: question,
    expansions,
    keywords: extractKeywords(question),
  };
}

/**
 * Gerar queries de busca a partir de uma pergunta expandida
 * Cria múltiplas versões da pergunta para aumentar recall
 */
export function generateSearchQueries(question) {
  const expanded = expandQuery(question);
  const queries = [question]; // Sempre inclui a original

  // Adiciona expansões diretas
  for (const expansion of expanded.expansions.slice(1)) {
    // Tenta substituir na pergunta original
    const keywords = expanded.keywords;
    if (keywords.length > 0) {
      queries.push(`${expansion} ${keywords.join(' ')}`);
    }
  }

  // Adiciona busca por keywords puras
  if (expanded.keywords.length > 0) {
    queries.push(expanded.keywords.join(' '));
  }

  // Remove duplicatas (por normalize) e limita
  const seen = new Set();
  const uniqueQueries = queries.filter(q => {
    const norm = normalizeText(q);
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });

  return {
    queries: uniqueQueries.slice(0, 8), // Máximo 8 queries
    keywords: expanded.keywords,
    original: question,
  };
}

/**
 * Calcular relevância textual entre keywords e um trecho
 * Usado como fallback quando embedding falha
 */
export function calculateTextRelevance(chunk, keywords) {
  if (!keywords || keywords.length === 0) return 0;

  const normalizedChunk = normalizeText(chunk);
  const chunkWords = new Set(normalizedChunk.split(/\s+/));

  let matchCount = 0;
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    // Match exato ou parcial
    if (normalizedChunk.includes(normalizedKeyword)) {
      matchCount++;
    }
    // Match em palavras individuais para keywords compostas
    const keywordWords = normalizedKeyword.split(/\s+/);
    const matchedWords = keywordWords.filter(w => chunkWords.has(w));
    if (matchedWords.length === keywordWords.length) {
      matchCount += 0.5; // Bônus por match completo
    }
  }

  return Math.min(matchCount / keywords.length, 1.0);
}

/**
 * Re-rank chunks combinando similaridade vetorial + textual
 */
export async function rerankChunks(chunks, queryEmbedding, keywords, originalQuestion) {
  if (!chunks || chunks.length === 0) return [];

  const { cosineSimilarity } = await import('./embedding.service.js');

  return chunks
    .map(chunk => {
      const vectorScore = chunk.similarity || 0;
      const textScore = calculateTextRelevance(chunk.conteudo, keywords);

      // Combina: 70% vetorial + 30% textual
      const combinedScore = (0.7 * vectorScore) + (0.3 * textScore);

      return {
        ...chunk,
        vectorScore,
        textScore,
        combinedScore,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore);
}

export default {
  expandQuery,
  generateSearchQueries,
  extractKeywords,
  calculateTextRelevance,
  rerankChunks,
  SYNONYM_MAP,
  STOPWORDS,
};
