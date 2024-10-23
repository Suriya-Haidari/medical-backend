import express from "express";
import pool from "../utils/db.js"; // Ensure you import your database utility

import jwt from "jsonwebtoken";

const router = express.Router();

const authenticateJWT = (req, res, next) => {
  const token =
    req.cookies.token ||
    req.headers.authorization?.split(" ")[1] ||
    req.query.token;

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId || decoded.id, // Adjust here based on your token structure
      role: decoded.role,
    };
    next();
  } catch (error) {
    console.error("Invalid token:", error.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

router.post("/logout", authenticateJWT, async (req, res) => {
  // Add middleware here
  try {
    const userId = req.user.id; // Access the user ID from req.user
    console.log("Logging out user with ID:", userId); // Debugging line

    // Invalidate the user's session in the database
    const result = await pool.query(
      `UPDATE users SET session_id = NULL, refresh_token = NULL WHERE id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      console.error("No user found with ID:", userId);
      return res.status(404).json({ message: "User not found." });
    }

    // Clear the token cookie from the browser
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Failed to log out." });
  }
});

export default router;
