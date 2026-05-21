import { Worker } from "bullmq";
import redis from "../config/redis.js";

import { fetchMetadata } from "../utils/metadata.js";
import { generateEmbedding } from "../services/embedding.service.js";
import { updateUrlEmbedding } from "../repositories/url.repository.js";

const worker = new Worker(
  "embedding-events",
  async (job) => {
    console.log("📥 Job received:", job.id, job.data);

    const { urlId, originalUrl } = job.data;

    try {
      console.log("🌐 Fetching metadata...");
      const { title, description } = await fetchMetadata(originalUrl);

      console.log("🧠 Generating embedding...");
      const embedding = await generateEmbedding({
        title,
        description,
        originalUrl,
      });

      if (!embedding) {
        console.warn("⚠️ Embedding is null", { urlId });
        return;
      }

      console.log("💾 Saving to DB...");
      await updateUrlEmbedding({
        urlId,
        embedding,
        title,
        summary: description,
      });

      console.log("✅ Done:", urlId);
    } catch (err) {
      console.error("❌ Worker failed:", err);
      throw err;
    }
  },
  {
    connection: redis,
  }
);

// Optional: logging hooks
worker.on("completed", (job) => {
  console.log(`Embedding job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`Embedding job failed: ${job?.id}`, err);
});