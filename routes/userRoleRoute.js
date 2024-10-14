import express from "express";
import env from "dotenv";
import pool from "../utils/db.js";
import jwt from "jsonwebtoken";

env.config();
const router = express.Router();

// JWT Authentication Middleware
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
      id: decoded.id || decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Invalid token:", error.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Fetch User Role Route
router.get("/api/user/role", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id; // Always use `id` from `req.user`, set by the middleware

    if (!userId) {
      return res.status(403).json({ message: "Forbidden: No user ID found" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    res.status(200).json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      role: user.role,
      full_Name: user.full_name,
      token: user.session_id, // session_id column is being used as the token
    });
  } catch (error) {
    console.error("Error fetching user role:", error.message);
    res.status(500).json({ message: "Failed to fetch user role" });
  }
});

export default router; // Export the router
