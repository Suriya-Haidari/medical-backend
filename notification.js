// import nodemailer from "nodemailer";
// import env from "dotenv";
// import { google } from "googleapis";
// env.config();

// const CLIENT_ID = process.env.CLIENT__ID;
// const CLIENT_SECRET = process.env.CLIENT__SECRET;
// const REFRESH_TOKEN = process.env.REFRESH__TOKEN;
// const REDIRECT_URL = process.env.REDIRECT__URL;

// const oAuth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   REDIRECT_URL
// );

// oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
// async function sendMail(fullName, email) {
//   try {
//     const accessToken = await oAuth2Client.getAccessToken();
//     const myEMail = process.env.MY_EMAIL;
//     const transport = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         type: "OAuth2",
//         user: myEMail,
//         clientId: CLIENT_ID,
//         clientSecret: CLIENT_SECRET,
//         refreshToken: REFRESH_TOKEN,
//         accessToken: accessToken,
//       },
//     });

//     const mailOption = {
//       from: "Suriya Haidari 📨 <soriahaidary17@gmail.com>",
//       to: email,
//       subject: "Medical Website 👋",
//       text: `Hello {${fullName}}, welcome to the medical news part!`,
//       html: `<h1>Hello ${fullName},</h1> 
//              <p>Welcome! You can now access the latest medical news shared via the hospital. Thanks!</p>`,
//     };

//     const result = await transport.sendMail(mailOption);
//     return result;
//   } catch (error) {
//     return error;
//   }
// }

// sendMail()
//   .then((result) => console.log("email sent... ", result))
//   .catch((error) => console.log(error.message));

// export default sendMail;



import nodemailer from "nodemailer";
import env from "dotenv";
import { google } from "googleapis";

env.config();

const CLIENT_ID = process.env.CLIENT__ID;
const CLIENT_SECRET = process.env.CLIENT__SECRET;
const REFRESH_TOKEN = process.env.REFRESH__TOKEN;
const REDIRECT_URL = process.env.REDIRECT__URL;
const MY_EMAIL = process.env.MY_EMAIL;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(fullName, email) {
  try {
    // Try to get a valid access token
    const accessToken = await oAuth2Client.getAccessToken();

    // Create a Nodemailer transport
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: MY_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token, // Use the access token obtained
      },
    });

    const mailOption = {
      from: `Suriya Haidari 📨 <${MY_EMAIL}>`,
      to: email,
      subject: "Medical Website 👋",
      text: `Hello ${fullName}, welcome to the medical news part!`,
      html: `<h1>Hello ${fullName},</h1>
             <p>Welcome! You can now access the latest medical news shared via the hospital. Thanks!</p>`,
    };

    const result = await transport.sendMail(mailOption);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);

    // Check if the error is due to an expired access token
    if (error.code === 401) {
      console.log("Access token expired, trying to refresh...");
      try {
        // Try to refresh the access token
        const newAccessToken = await oAuth2Client.getAccessToken();

        // Retry sending the email with the new access token
        const transport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: MY_EMAIL,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: newAccessToken.token,
          },
        });

        const result = await transport.sendMail(mailOption);
        return result;
      } catch (refreshError) {
        console.error("Failed to refresh access token:", refreshError);
        throw refreshError; // Re-throw the error if refresh fails
      }
    }
    throw error; // Rethrow other errors
  }
}


sendMail()
  .then((result) => console.log("email sent... ", result))
  .catch((error) => console.log(error.message));

export default sendMail;
