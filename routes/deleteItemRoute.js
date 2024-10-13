import express from "express";
import cors from "cors";
import env from "dotenv";
import pool from "../utils/db.js";
env.config();
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

const router = express.Router();

router.use(cors());

router.delete("/:option/:id", async (req, res) => {
  const { id, option } = req.params;
  try {
    const tableName = getTableName(option);
    console.log("Deleting from table:", tableName, "with ID:", id);
    const result = await pool.query(
      `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
      [id]
    );

    if (!result.rowCount)
      return res.status(404).json({ message: "Item not found" });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting item:", error); // Log the error details
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

export default router;
