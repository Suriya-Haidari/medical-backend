import express from "express";
import pool from "./db.js"; // Import the pool from db.js

const router = express.Router();

// Fetch notifications for a specific user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const notifications = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(notifications.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE notifications SET read = TRUE WHERE id = $1", [
      id,
    ]);
    res.send("Notification marked as read");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.post("/", async (req, res) => {
  const { user_id, message } = req.body;
  try {
    const newNotification = await pool.query(
      "INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *",
      [user_id, message]
    );

    // Log to file
    const logEntry = `${new Date().toISOString()} - User ID: ${user_id}, Message: ${message}\n`;
    fs.appendFileSync(path.join(__dirname, "notifications.log"), logEntry);

    res.json(newNotification.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Create new notification
router.post("/", async (req, res) => {
  const { user_id, message } = req.body;
  try {
    const newNotification = await pool.query(
      "INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *",
      [user_id, message]
    );
    res.json(newNotification.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// In your notifications route file
router.post("/", async (req, res) => {
  const { user_id, message } = req.body;
  try {
    const newNotification = await pool.query(
      "INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *",
      [user_id, message]
    );
    res.json(newNotification.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

export default router;
