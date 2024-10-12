import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Route to check authentication status
router.get("/auth/status", (req, res) => {
  const token = req.cookies.token;

  // If there's no token, user is not authenticated
  if (!token) {
    return res.status(200).json({ isAuthenticated: false });
  }

  try {
    // Verify the token with JWT secret
    jwt.verify(token, JWT_SECRET);
    res.status(200).json({ isAuthenticated: true });
  } catch (error) {
    // Token is invalid or expired
    res.status(200).json({ isAuthenticated: false });
  }
});

export default router;
