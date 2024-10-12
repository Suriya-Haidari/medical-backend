
import pkg from "pg";
const { Pool } = pkg;
import env from "dotenv";

env.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Database connection
pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL!");
    return pool.query("SELECT NOW()");
  })
  .then((res) => {
    console.log("Current Time:", res.rows[0]);
  })
  .catch((err) => console.error("Connection error", err.stack))
  .finally(() => {
    // pool.end();
  });

export default pool;
