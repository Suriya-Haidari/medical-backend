import express from "express";
import pool from "../utils/db.js";
import { handleNewEmail } from "../index.js";
import sendMail from "../notifications.js";

const router = express.Router();

// router.post("/", async (req, res) => {
//   const { fullName, email, message } = req.body;

//   try {
//     // Get today's date
//     const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

//     // Check the current count for today
//     const countResult = await pool.query(
//       "SELECT appointment_count FROM formNotifications WHERE created_at::date = $1",
//       [today]
//     );

//     let currentCount = 0;

//     if (countResult.rows.length > 0) {
//       currentCount = countResult.rows[0].appointment_count;
//     }

//     // Increment or reset the count
//     if (currentCount < 20) {
//       currentCount++;
//     } else {
//       currentCount = 1; // Reset to 1 after reaching 20
//     }

//     // Store notification in the database
//     const result = await pool.query(
//       "INSERT INTO formNotifications (full_name, email, message, appointment_count) VALUES ($1, $2, $3, $4) RETURNING *",
//       [fullName, email, message, currentCount]
//     );

//     const newNotification = result.rows[0];

//     // Send the new notification to all connected clients
//     handleNewEmail(newNotification); // Pass the entire newNotification object

//     // Send an email to the specified address
//     const recipientEmail = "marwahaidari86@gmail.com"; // Your specified email
//     const emailSubject = "New Notification Received";
//     const emailBody = `
//       New notification received:
    
//       Full Name: ${fullName}
//       Email: ${email}
//       Message: ${message}
//       Appointment Count: ${currentCount}
//     `;

//     // Call the sendMail function
//     await sendMail(emailSubject, emailBody, recipientEmail);

//     res.status(201).json(newNotification);
//   } catch (error) {
//     console.error("Error saving notification:", error);
//     res.status(500).json({ error: "Failed to save notification" });
//   }
// });


router.post("/", async (req, res) => {
  const { fullName, email, message } = req.body;

  try {
    // Get today's date in 'YYYY-MM-DD' format
    const today = new Date().toISOString().split("T")[0];

    // Start a transaction to ensure data consistency
    await pool.query("BEGIN");

    // Check the current appointment count for today
    const countResult = await pool.query(
      "SELECT appointment_count FROM formNotifications WHERE created_at::date = $1 ORDER BY id DESC LIMIT 1",
      [today]
    );

    // Determine the current count
    let currentCount = countResult.rows.length > 0 
      ? countResult.rows[0].appointment_count 
      : 0;

    // Increment the count (reset to 1 if it reaches 20)
    currentCount = currentCount < 20 ? currentCount + 1 : 1;

    // Insert the new notification with the incremented appointment count
    const result = await pool.query(
      "INSERT INTO formNotifications (full_name, email, message, appointment_count) VALUES ($1, $2, $3, $4) RETURNING *",
      [fullName, email, message, currentCount]
    );

    const newNotification = result.rows[0];

    // Commit the transaction
    await pool.query("COMMIT");

    // Notify connected clients
    handleNewEmail(newNotification);

    // Prepare email details
    const recipientEmail = "marwahaidari86@gmail.com";
    const emailSubject = "New Notification Received";
    const emailBody = `
      New notification received:

      Full Name: ${fullName}
      Email: ${email}
      Message: ${message}
      Appointment Count: ${currentCount}
    `;

    // Send the notification email
    await sendMail(emailSubject, emailBody, recipientEmail);

    // Respond with the new notification
    res.status(201).json(newNotification);
  } catch (error) {
    // Rollback transaction on error
    await pool.query("ROLLBACK");
    console.error("Error saving notification:", error);
    res.status(500).json({ error: "Failed to save notification" });
  }
});


router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM formNotifications ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:notificationId", async (req, res) => {
  const notificationId = req.params.notificationId; // Fix here
  try {
    const result = await pool.query(
      "DELETE FROM formNotifications WHERE id = $1 RETURNING *",
      [notificationId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const resetAppointmentCounts = async () => {
  try {
    await pool.query(
      "UPDATE formNotifications SET appointment_count = 0 WHERE created_at < NOW() - INTERVAL '12 HOURS'"
    );
    console.log(
      "Appointment counts reset for notifications older than 12 hours"
    );
  } catch (error) {
    console.error(error);
  }
};

export const deleteOldNotifications = async () => {
  try {
    await pool.query(
      "DELETE FROM formNotifications WHERE created_at < NOW() - INTERVAL '24 HOURS'"
    );
    console.log("Old notifications deleted");
  } catch (error) {
    console.error(error);
  }
};

export default router;
