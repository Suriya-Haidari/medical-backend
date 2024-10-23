import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";
import env from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET; // Add this in your .env file
const app = express();
env.config();

router.use(
  cors({
    origin: "https://suriya-haidari.github.io",
    credentials: true, // Allow cookies and credentials to be sent
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Function to generate JWT token
const generateToken = (userId, role) =>
  jwt.sign({ userId: parseInt(userId), role }, JWT_SECRET, { expiresIn: "1h" });

// Function to generate Refresh Token
const generateRefreshToken = (userId) =>
  jwt.sign({ userId: parseInt(userId) }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

// Sign-in route
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT id, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    if (user.password_hash === "google") {
      const token = generateToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);
      await pool.query(
        "UPDATE users SET session_id = $1, refresh_token = $2 WHERE id = $3",
        [token, refreshToken, user.id]
      );
      return res.json({ token, refreshToken });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await pool.query(
      "UPDATE users SET session_id = $1, refresh_token = $2 WHERE id = $3",
      [token, refreshToken, user.id]
    );

    res.json({
      message: "User logged in successfully",
      role: user.role,
      token: token,
      refreshToken: refreshToken,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Refresh token route
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.sendStatus(401); // Unauthorized
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const result = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND refresh_token = $2",
      [decoded.userId, refreshToken]
    );

    if (!result.rows.length) {
      return res.sendStatus(403); // Forbidden
    }

    const newToken = generateToken(decoded.userId, result.rows[0].role);
    res.json({ token: newToken });
  } catch (err) {
    console.error(err);
    return res.sendStatus(403); // Forbidden
  }
});

export default router;
