import express from "express";
import env from "dotenv";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";
const router = express.Router();

env.config();
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
const authorizeManagerOrAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res
      .status(403)
      .json({ message: "Access forbidden: Admins and Managers only." });
  }
  next();
};
// Manager/Protected route
router.get(
  "/api/manager/protected",
  authenticateJWT,
  authorizeManagerOrAdmin,
  (req, res) => {
    res.json({ message: "Manager-only route accessed!" });
  }
);

// Promotion to Admin Route (Managers can promote others to Admin)
router.post(
  "/api/promotetoadmin",
  authenticateJWT,
  authorizeManagerOrAdmin,
  async (req, res) => {
    const { userId } = req.body; // Manager will send userId to promote

    try {
      // Fetch user to promote by userId
      const userResult = await pool.query(
        "SELECT id, role FROM users WHERE id = $1",
        [userId]
      );

      if (!userResult.rows.length) {
        return res.status(404).json({ message: "User not found." });
      }

      const user = userResult.rows[0];

      // Only allow promoting users who are not already admins
      if (user.role === "admin") {
        return res.status(400).json({ message: "User is already an admin." });
      }

      // Promote user to admin by updating role
      await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [
        userId,
      ]);
      const role = user.role;
      res
        .status(200)
        .json({ message: `User ${userId} promoted to admin.`, role });
    } catch (error) {
      console.error("Promotion Error:", error.message);
      res.status(500).json({ message: "Failed to promote user." });
    }
  }
);

export default router;
