
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";
import sendMail from "../notification.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET; // Add this in your .env file

// Function to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ userId: parseInt(userId), role }, JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Function to generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId: parseInt(userId) }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
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

    const loginData = {
      login_time: now,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    };

    // Insert user into the database
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, session_data, role, full_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [email, hashedPassword, JSON.stringify(loginData), role, fullName]
    );

    const userId = result.rows[0].id;

    // Generate token and refresh token
    const token = generateToken(userId, role);
    const refreshToken = generateRefreshToken(userId);

    // Update the user's session_id and refresh_token
    await pool.query(
      `UPDATE users SET session_id = $1, refresh_token = $2 WHERE id = $3`,
      [token, refreshToken, userId]
    );

    // Send registration email notification to the registered email
    await sendMail(fullName, email);

    // Return response with userId, token, and refreshToken
    res.status(201).json({
      message: "User registered successfully",
      userId,
      token,
      refreshToken,
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

    let userId;

    if (userCheck.rows.length > 0) {
      userId = userCheck.rows[0].id; // User exists, retrieve their ID
    } else {
      // New user, insert into the database
      const role = "user"; // Default role for new users
      const now = new Date().toISOString();

      const loginData = {
        login_time: now,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      };

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, session_data, role, full_name)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          email,
          "google", // Indicating sign-up via Google
          JSON.stringify(loginData),
          role,
          fullName,
        ]
      );

      userId = result.rows[0].id; // Get the newly created user ID
    }

    // Generate token and refresh token
    const token = generateToken(userId, "user"); // Use "user" role directly
    const refreshToken = generateRefreshToken(userId);

    // Update the user's session_id and refresh_token
    await pool.query(
      `UPDATE users SET session_id = $1, refresh_token = $2 WHERE id = $3`,
      [token, refreshToken, userId]
    );

    // Return response with userId, token, and refreshToken
    res.status(200).json({
      message:
        userCheck.rows.length > 0
          ? "User signed in successfully via Google"
          : "User registered successfully via Google",
      userId,
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    res.status(500).json({ message: "Failed to register user." });
  }
});

export default router;
