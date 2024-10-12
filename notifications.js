import nodemailer from "nodemailer";
import { google } from "googleapis";

const CLIENT_ID = process.env.CLIENT__ID;
const CLIENT_SECRET = process.env.CLIENT__SECRET;
const REFRESH_TOKEN = process.env.REFRESH__TOKEN;
const REDIRECT_URL = process.env.REDIRECT__URL;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(subject, body, recipientEmail) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "marwahaidari86@gmail.com", // Replace with your email address
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: "your_email@gmail.com", // Replace with your email address
      to: recipientEmail,
      subject: subject,
      text: body,
      html: body.replace(/(?:\r\n|\r|\n)/g, "<br>"), // Convert new lines to HTML breaks
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}

export default sendMail;
