import { embeddingModel } from "../config/gemini.js";

// Build clean input text for embedding
function buildEmbeddingText({ title, description, originalUrl }) {
  return [title, description, originalUrl]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function generateEmbedding({
  title,
  description,
  originalUrl,
}) {
  const text = buildEmbeddingText({ title, description, originalUrl });

  // Guard: avoid empty embeddings
  if (!text) return null;

  try {
    // Limit input size (Gemini has ~2048 token limit)
    const trimmedText = text.slice(0, 6000);

    const result = await embeddingModel.embedContent({
      content: {
        parts: [{ text: trimmedText }],
      },
      // DO NOT change this unless DB changes
      outputDimensionality: 768,
    });

    const vector = result.embedding.values;

    return vector;
  } catch (err) {
    console.error("Embedding generation failed:", err.message);

    // Do NOT crash pipeline
    return null;
  }
}