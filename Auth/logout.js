import express from "express";
import jwt from "jsonwebtoken";
import db from "../utils/db.js";
 
const router = express.Router();

router.post("/logout", async (req, res) => {
  try {
    // Clear the token cookie first, no matter what
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Extract the token from the cookie or authorization header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.json({ message: "Logged out successfully (no token)." });
    }

    try {
      // Verify and decode the token to get the user ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Remove session from the database
      await db.query("UPDATE users SET session_id = NULL WHERE id = $1", [
        userId,
      ]);

      return res.json({ message: "Logged out successfully (token removed)." });
    } catch (error) {
      console.error("Token verification failed:", error);
      // Token might be invalid or expired, still return success
      return res.json({ message: "Logged out with invalid/expired token." });
    }
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Failed to log out." });
  }
});

export default router;
