import express from "express";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";
import env from "dotenv";

env.config();

const router = express.Router();

const authenticateJWT = (req, res, next) => {
  const token =
    req.cookies.token ||
    req.headers.authorization?.split(" ")[1] ||
    req.query.token;

  if (!token) {
    console.log("No token provided");
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

// Get all notifications
router.get("/notifications", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve notifications:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update notification as read
router.patch("/notifications/:id", authenticateJWT, async (req, res) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const notificationId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *",
      [notificationId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification updated successfully" });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/notifications", authenticateJWT, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id; // Retrieve the manager's ID from the token

  if (!message) {
    return res.status(400).json({ message: "Message is required." });
  }

  try {
    // Check if the user exists in the users table (this should be the manager)
    const userResult = await pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);

    if (userResult.rowCount === 0) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Insert the notification with the manager's ID
    const result = await pool.query(
      "INSERT INTO notifications (message, user_id) VALUES ($1, $2) RETURNING *",
      [message, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
