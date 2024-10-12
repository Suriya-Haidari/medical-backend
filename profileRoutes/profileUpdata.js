import express from "express";
import bcrypt from "bcrypt";
import env from "dotenv";
import jwt from "jsonwebtoken";
import pool from '../utils/db.js
env.config();
const router = express.Router();


// JWT Authentication Middleware
const authenticateJWt2 = (req, res, next) => {
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

// Update User Profile Route
router.put("/api/users/:id", authenticateJWt2, async (req, res) => {
  const { id } = req.params;
  const { fullName, email, password } = req.body; // Add password to req.body
  const userId = req.user.userId; // From JWT authentication

  try {
    // Ensure the user is authorized to update this profile
    if (parseInt(id) !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this profile." });
    }

    // Hash the password if it exists
    let hashedPassword = null;
    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    // Update user profile
    const updateFields = [];
    const updateValues = [];

    if (fullName) {
      updateFields.push("full_name");
      updateValues.push(fullName);
    }
    if (email) {
      updateFields.push("email");
      updateValues.push(email);
    }
    if (hashedPassword) {
      updateFields.push("password_hash");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    // Construct the SQL query dynamically based on the fields provided
    const setClause = updateFields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const query = `UPDATE users SET ${setClause} WHERE id = $${
      updateFields.length + 1
    } RETURNING *`;

    updateValues.push(id); // Add the user ID as the last parameter

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating user profile:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
