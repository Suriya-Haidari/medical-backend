import express from "express";

const router = express.Router();

router.post("/logout", async (req, res) => {
  try {
    // Clear the token cookie from the browser
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to log out." });
  }
});

export default router;
