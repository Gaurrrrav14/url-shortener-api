import pkg from "pg";
import env from "./env.js";
import { registerType } from "pgvector/pg";

const { Pool } = pkg;

// Create pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

  // Fail-fast startup check
  // Ensures DB is reachable when app boots
 
pool.on("connect", async (client) => {
  try {
    await registerType(client);
    console.log("PostgreSQL connected + pgvector registered");
  } catch (err) {
    console.error("pgvector registration failed:", err.message);
  }
});

//Handle unexpected errors on idle clients
pool.on("error", (err) => {
  console.error(" Unexpected PostgreSQL error:", err);
  process.exit(1);
});

export default pool;