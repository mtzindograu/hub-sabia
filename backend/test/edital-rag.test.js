import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import Edital from "../src/models/Edital.js";

const originalFindById = Edital.findById;

const queryEmbedding = [1, 0];
const chunks = [
  { _id: "a", conteudo: "A", embedding: [1, 0], chunk_index: 0 },
  { _id: "b", conteudo: "B", embedding: [0.6, 0.8], chunk_index: 1 },
  { _id: "c", conteudo: "C", embedding: [0, 1], chunk_index: 2 },
  { _id: "d", conteudo: "D", embedding: [0.9, 0.1], chunk_index: 3 },
];

const edital = {
  _id: "edital-1",
  embedding_model: "local",
  chunks,
};

afterEach(() => {
  Edital.findById = originalFindById;
});

test("busca vetorial reutiliza edital plain sem segunda consulta", async () => {
  let findByIdCalls = 0;
  Edital.findById = async () => {
    findByIdCalls++;
    return edital;
  };

  const result = await Edital.buscarChunksPorSimilaridade(
    edital._id,
    queryEmbedding,
    2,
    edital,
  );

  assert.equal(findByIdCalls, 0);
  assert.deepEqual(result.map(chunk => chunk.chunk_index), [0, 3]);
});

test("busca vetorial preserva threshold, ordem, topK e embeddings", async () => {
  const before = structuredClone(chunks);
  const result = await Edital.buscarChunksPorSimilaridade(
    edital._id,
    queryEmbedding,
    3,
    edital,
  );

  assert.deepEqual(result.map(chunk => chunk.chunk_index), [0, 3, 1]);
  assert.ok(result.every(chunk => chunk.similarity >= 0.2));
  assert.equal(result.length, 3);
  assert.deepEqual(chunks, before);
  assert.deepEqual(result.map(chunk => chunk.embedding), [
    [1, 0],
    [0.9, 0.1],
    [0.6, 0.8],
  ]);
});

test("busca vetorial retorna vazio para edital sem chunks", async () => {
  const result = await Edital.buscarChunksPorSimilaridade(
    "empty",
    queryEmbedding,
    10,
    { embedding_model: "local", chunks: [] },
  );

  assert.deepEqual(result, []);
});

test("busca vetorial mantém vazio para edital inexistente", async () => {
  Edital.findById = async () => null;

  const result = await Edital.buscarChunksPorSimilaridade(
    "missing",
    queryEmbedding,
    10,
  );

  assert.deepEqual(result, []);
});

test("API legada continua buscando edital quando não recebe objeto reutilizado", async () => {
  let findByIdCalls = 0;
  const legacyEdital = {
    ...edital,
    chunks: chunks.map(chunk => ({
      ...chunk,
      toObject: () => ({ ...chunk }),
    })),
  };
  Edital.findById = async () => {
    findByIdCalls++;
    return legacyEdital;
  };

  const result = await Edital.buscarChunksPorSimilaridade("legacy", queryEmbedding, 1);

  assert.equal(findByIdCalls, 1);
  assert.deepEqual(result.map(chunk => chunk.chunk_index), [0]);
});
