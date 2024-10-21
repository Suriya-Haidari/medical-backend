import nodemailer from "nodemailer";
import env from "dotenv";

env.config(); // Load environment variables from .env file

const MY_EMAIL = process.env.MY_EMAIL; // Your Gmail address
const APP_PASSWORD = process.env.APP_PASSWORD; // Gmail App Password

async function sendMail(subject, body, recipientEmail) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MY_EMAIL, // Your email address
        pass: APP_PASSWORD, // Your App Password
      },
    });

    const mailOptions = {
      from: MY_EMAIL, // Sender's email
      to: recipientEmail, // Receiver's email
      subject: subject, // Email subject
      text: body, // Plain text version of the email
      html: body.replace(/\n/g, "<br>"), // Convert newlines to <br> for HTML
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}

// Example usage:
// sendMail(
//   "Test Subject",
//   "Hello,\nThis is a test email.",
//   "recipient@example.com"
// )
//   .then((result) => console.log("Email sent:", result))
//   .catch((error) => console.error("Failed to send email:", error.message));

export default sendMail;
