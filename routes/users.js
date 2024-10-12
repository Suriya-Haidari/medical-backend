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

const authenticateJWT = (req, res, next) => {
  const token =
    req.cookies.token ||
    req.headers.authorization?.split(" ")[1] ||
    req.query.token;
  // console.log(token);
  if (!token) {
    console.log("No token provided");
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both Google and custom JWTs
    req.user = {
      id: decoded.id || decoded.userId, // Google might have id, custom auth might have userId
      role: decoded.role, // Ensure the role is also captured if needed
    };
    // console.log(token);

    next();
  } catch (error) {
    console.error("Invalid token:", error.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

// GET /api/users
router.get("/", authenticateJWT, async (req, res) => {
  try {
    // Fetch email and role from the users table
    const result = await pool.query("SELECT id, email, role FROM users");

    // Check if there are any users
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    // Respond with the list of users
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

export default router;
