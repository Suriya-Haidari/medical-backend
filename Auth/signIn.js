import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";
import env from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
env.config();

router.use(
  cors({
   origin: "https://suriya-haidari.github.io",
   credentials: true, // Allow cookies and credentials to be sent
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
   allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Function to generate JWT token
// Change expiresIn to "10d" for a 10-day expiration
const generateToken = (userId, role) =>
  jwt.sign({ userId: parseInt(userId), role }, JWT_SECRET, { expiresIn: "10d" });

// Sign-in route
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch user data from the database
    const result = await pool.query(
      "SELECT id, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // If the user has signed up with Google, skip the password check
    if (user.password_hash === "google") {
      // Generate token for Google users
      const token = generateToken(user.id, user.role);

      // Update the session token in the database
      await pool.query("UPDATE users SET session_id = $1 WHERE id = $2", [
        token,
        user.id,
      ]);

      return res.json({ token });
    }

    // If the user has a regular account, check the password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token for regular users
    const token = generateToken(user.id, user.role);

    // Update the session token in the database
    await pool.query("UPDATE users SET session_id = $1 WHERE id = $2", [
      token,
      user.id,
    ]);

    res.json({
      message: "User logged in successfully",
      role: user.role,
      token: token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
