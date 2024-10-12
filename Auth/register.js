import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";
import sendMail from "../notification.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Function to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ userId: parseInt(userId), role }, JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Register route
router.post("/register", async (req, res) => {
  const { email, password, fullName } = req.body;

  try {
    // Check if the email already exists
    const userCheck = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User already exists. Please sign in." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = "user"; // Default role for new users
    const now = new Date().toISOString();

    const sessionExpiry = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString(); // 24 hours from now

    const loginData = {
      login_time: now,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    };

    // Insert user into the database
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, session_expiry, session_data, role, full_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        email,
        hashedPassword,
        sessionExpiry,
        JSON.stringify(loginData),
        role,
        fullName,
      ]
    );

    const userId = result.rows[0].id;

    // Generate token using the new userId and role
    const token = generateToken(userId, role);

    // Update the user's session_id with the generated token
    await pool.query(`UPDATE users SET session_id = $1 WHERE id = $2`, [
      token,
      userId,
    ]);

    // Send registration email notification to the registered email
    await sendMail(fullName, email);

    // Return response with userId and token
    res.status(201).json({
      message: "User registered successfully",
      userId,
      token,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Failed to register user." });
  }
});

// Google Sign-in route
router.post("/google-signin", async (req, res) => {
  const { email, fullName } = req.body;

  try {
    // Check if the email already exists
    const userCheck = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User already exists. Please sign in." });
    }

    // Store additional info when using Google
    const role = "user"; // Default role for new users
    const now = new Date().toISOString();

    const loginData = {
      login_time: now,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    };

    // Insert user into the database
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, session_data, role, full_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        email,
        "google", // Instead of a simple string, we can use a more complex structure
        JSON.stringify(loginData),
        role,
        fullName,
      ]
    );

    const userId = result.rows[0].id;

    // Generate token using the new userId and role
    const token = generateToken(userId, role);

    // Update the user's session_id with the generated token
    await pool.query(`UPDATE users SET session_id = $1 WHERE id = $2`, [
      token,
      userId,
    ]);

    // Return response with userId and token
    res.status(201).json({
      message: "User registered successfully via Google",
      userId,
      token,
    });
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    res.status(500).json({ message: "Failed to register user." });
  }
});

export default router;
