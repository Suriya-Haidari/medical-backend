
import nodemailer from "nodemailer";
import env from "dotenv";

env.config(); // Load environment variables

const MY_EMAIL = process.env.MY_EMAIL; // Your Gmail address
const APP_PASSWORD = process.env.APP_PASSWORD; // App Password from Google

async function sendMail(fullName, email) {
  try {
    // Create a transporter with Gmail SMTP and App Password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MY_EMAIL, // Gmail email address
        pass: APP_PASSWORD, // App Password from Google
      },
    });

    const mailOptions = {
      from: `Suriya Haidari 📨 <${MY_EMAIL}>`,
      to: email,
      subject: "Medical Website 👋",
      html: `<h1>Hello ${fullName},</h1>
             <p>Welcome! You can now access the latest medical news shared via the hospital. Thanks!</p>`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
sendMail("John Doe", "john.doe@example.com")
  .then((result) => console.log("Email sent:", result))
  .catch((error) => console.error("Failed to send email:", error.message));

export default sendMail;
