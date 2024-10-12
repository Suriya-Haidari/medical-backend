import express from "express";
import pool from "../utils/db.js";
import env from "dotenv";
import jwt from "jsonwebtoken";

env.config();
const router = express.Router();

const authenticateJWT2 = (req, res, next) => {
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

// Delete User Profile Route
router.delete("/api/users/:id", authenticateJWT2, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId; // From JWT authentication
  const userRole = req.user.role; // Role is part of the JWT

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
