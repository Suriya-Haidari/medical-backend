import express from "express";
import pool from "../utils/db.js";
import env from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
const router = express.Router();

router.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // Allow cookies and credentials to be sent
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

env.config();

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(403).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info to the request
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Fetch User Registrations Route
router.get("/api/users/registrations", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query("SELECT created_at FROM users");

    if (!result.rows.length) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching registrations:", error.message);
    res.status(500).json({ message: "Failed to fetch user registrations" });
  }
});

export default router;
