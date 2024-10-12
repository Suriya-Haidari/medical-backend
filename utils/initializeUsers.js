import bcrypt from "bcrypt";
import pool from "../utils/db.js";
import env from "dotenv";

env.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Initialize manager user
export const initializeManager = async () => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      "manager@gmail",
    ]);

    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash("manager", 10);
      await pool.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
        ["manager@gmail", hashedPassword, "manager"]
      );
      console.log("Manager user created.");
    } else {
      console.log("Manager user already exists.");
    }
  } catch (error) {
    console.error("Error initializing manager user:", error.message);
  }
};

// Initialize admin user
export const initializeAdmin = async () => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      ADMIN_EMAIL,
    ]);

    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await pool.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
        [ADMIN_EMAIL, hashedPassword, "admin"]
      );
      console.log("Admin user created.");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (error) {
    console.error("Error initializing admin user:", error.message);
  }
};
