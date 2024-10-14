import express from "express";
import env from "dotenv";
import pool from "../utils/db.js";
const router = express.Router();

env.config();

// Function to map the option to the table name
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

// Route to get items based on option
router.get("/items/:option", async (req, res) => {
  const { option } = req.params;

  try {
    const tableName = getTableName(option); // Get the table name based on the option
    const result = await pool.query(`SELECT * FROM ${tableName}`);

    // Map over the rows and encode the image and file to base64 if they exist
    const items = result.rows.map((item) => ({
      ...item,
      image: item.image ? Buffer.from(item.image).toString("base64") : null,
      file: item.file ? Buffer.from(item.file).toString("base64") : null,
      fileType: item.file_type || null, // Make sure this matches the column name in your DB
    }));

    res.status(200).json(items); // Return the items as JSON
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
