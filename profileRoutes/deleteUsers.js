import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";
import env from "dotenv";

const router = express.Router();
router.use(
  cors({
    origin: "https://suriya-haidari.github.io",
    credentials: true, // Allow cookies and credentials to be sent
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

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
// Delete User Profile Route
router.delete("/admin/api/users/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId; // From JWT authentication
  const userRole = req.user.role; // Assuming role is part of the JWT

  try {
    // Allow deletion if the user is deleting their own profile or if they're a manager/admin
    if (
      parseInt(id) !== userId &&
      userRole !== "manager" &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this profile." });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Delete user profile
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(204).send(); // Success, no content to return
  } catch (error) {
    console.error("Error deleting user profile:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
