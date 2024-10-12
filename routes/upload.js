import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { sendNotificationToAll } from "../wsServer.js"; // WebSocket function
import env from "dotenv";
import pool from "../utils/db.js";
const router = express.Router();

env.config();

// JWT Authentication Middleware
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
      id: decoded.id || decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    console.error("Invalid token:", error.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

const storage = multer.memoryStorage();
const upload = multer({ storage });

const getTableName = (option) => {
  const tableMap = {
    doctors: "doctorsposts",
    hospital: "hospitalposts",
    sick: "sickpeopleposts",
  };

  const tableName = tableMap[option];
  if (!tableName) throw new Error("Invalid option");
  return tableName;
};

// Upload route
router.post(
  "/upload",
  authenticateJWT,
  upload.single("image"), // Only handle image upload
  async (req, res) => {
    const { title, paragraph, option } = req.body;
    const image = req.file ? req.file.buffer : null;

    try {
      const tableName = getTableName(option);
      const result = await pool.query(
        `INSERT INTO ${tableName} (title, paragraph, option, image) VALUES ($1, $2, $3, $4) RETURNING *`,
        [title, paragraph, option, image]
      );

      const notification = {
        message: `A new post titled "${title}" has been created.`,
      };

      await pool.query("INSERT INTO notifications (message) VALUES ($1)", [
        notification.message,
      ]);

      sendNotificationToAll(notification);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error while processing the upload:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

export default router;
