import pkg from "pg";
import env from "./env.js";

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
 
pool.connect()
  .then((client) => {
    console.log("🟢 PostgreSQL pool initialized");
    client.release(); // VERY IMPORTANT
  })
  .catch((err) => {
    console.error("🔴 Postgres connection failed:", err.message);
    process.exit(1);
  });

//Log whenever a new client is created
pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

//Handle unexpected errors on idle clients
pool.on("error", (err) => {
  console.error("🔴 Unexpected PostgreSQL error:", err);
  process.exit(1);
});

export default pool;