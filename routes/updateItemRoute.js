import express from "express";
import pool from "../utils/db.js";
import multer from "multer";

const router = express.Router();
const upload = multer();

// Function to get table name based on the option
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

// Existing PUT route to update entire post
router.put("/:option/:id", upload.single("image"), async (req, res) => {
  const { id, option } = req.params;
  const { title, paragraph } = req.body;
  const image = req.file ? req.file.buffer : null;

  try {
    const tableName = getTableName(option);
    const currentItem = await pool.query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [id]
    );

    if (!currentItem.rows.length)
      return res.status(404).json({ message: "Item not found" });

    const updatedImage = image || currentItem.rows[0].image;
    const result = await pool.query(
      `UPDATE ${tableName} SET title = $1, paragraph = $2, image = $3 WHERE id = $4 RETURNING *`,
      [title, paragraph, updatedImage, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating item:", error); // Add error logging for debugging
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// New PATCH route to partially update a post
router.patch("/:option/:id", upload.single("image"), async (req, res) => {
  const { id, option } = req.params;
  const { title, paragraph } = req.body;
  const image = req.file ? req.file.buffer : null; // Get the uploaded file, if any

  try {
    const tableName = getTableName(option);
    const currentItem = await pool.query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [id]
    );

    if (!currentItem.rows.length)
      return res.status(404).json({ message: "Item not found" });

    // Prepare fields to update
    const updatedFields = {
      title: title || currentItem.rows[0].title,
      paragraph: paragraph || currentItem.rows[0].paragraph,
      image: image || currentItem.rows[0].image,
    };

    // Update only the fields that are provided
    const result = await pool.query(
      `UPDATE ${tableName} SET title = $1, paragraph = $2, image = $3 WHERE id = $4 RETURNING *`,
      [updatedFields.title, updatedFields.paragraph, updatedFields.image, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
