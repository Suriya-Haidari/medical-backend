// import pkg from "pg";
// const { Pool } = pkg;
// import env from "dotenv";
// env.config();

// //  database connection to use in any file that need database quering
// const pool = new Pool({
//   user: process.env.DATABASE_USER,
//   host: process.env.DATABASE_HOST,
//   database: process.env.DATABASE_NAME,
//   password: process.env.DATABASE_PASSWORD,
//   port: process.env.DATABASE_PORT,
// });

// export default pool;

import pkg from "pg";
const { Pool } = pkg;
import env from "dotenv";

env.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Use this option in development; for production, set it up correctly with certificates.
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
