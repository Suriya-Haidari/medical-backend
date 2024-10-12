import bodyParser from "body-parser";
import cors from "cors";
import env from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import { googleAuthRoutes } from "./Auth/googleAuth.js";
import deleteItemRoute from "./routes/deleteItemRoute.js";
import updateItemRoute from "./routes/updateItemRoute.js";
import signinRoute from "./Auth/signIn.js";
import logoutRoute from "./Auth/logout.js";
import registerRoute from "./Auth/register.js";
import authStatusRoute from "./Auth/authStatus.js";
import itemsRoute from "./routes/items.js";
import { initializeManager, initializeAdmin } from "./utils/initializeUsers.js";
import notificationRoutes from "./notificationRoutes/notificationRoutes.js";
import uploadRoute from "./routes/upload.js";
import routes from "./Auth/verifyAdmin.js";
import userDeleteRoutes from "./profileRoutes/deleteUsers.js";
import userDeleteRoute from "./profileRoutes/userDeleteRoute.js";
import userRegistrationsRoute from "./profileRoutes/userRegistrationsRoute.js";
import userRoleRoute from "./routes/userRoleRoute.js";
import profileUpdata from "./profileRoutes/profileUpdata.js";
import users from "./routes/users.js";
import getNotificationsRoutes from "./routes/formNotifications.js";
import weatherRoutes from "./routes/weather.js";
env.config();
import formNotificationsRoutes from "./routes/formNotifications.js";
import deleteNotificationRoutes from "./routes/formNotifications.js";
import {
  resetAppointmentCounts,
  deleteOldNotifications,
} from "./routes/formNotifications.js";
import pool from "./utils/db.js";
const app = express();
const PORT = process.env.PORT || 3001;


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
googleAuthRoutes(app);
app.use("/api/items", deleteItemRoute);
app.use("/api/items", updateItemRoute);
app.use("/api/users", users);
app.use("/api", signinRoute);
app.use("/api", logoutRoute);
app.use("/api", registerRoute);
app.use("/api", authStatusRoute);
app.use("/api", itemsRoute);
app.use("/api", notificationRoutes);
app.use("/api", uploadRoute);
app.use(routes);
app.use(userDeleteRoutes);
app.use(userDeleteRoute);
app.use(userRegistrationsRoute);
app.use(userRoleRoute);
app.use(profileUpdata);
app.use("/api/weather", weatherRoutes);
app.use("/api/formNotifications", formNotificationsRoutes);
app.use("/api/formNotifications", getNotificationsRoutes);
app.use("/api/formNotifications", deleteNotificationRoutes);
const corsOptions = {
  origin: "https://suriya-haidari.github.io",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // List of allowed methods
  credentials: true, // If you need to allow cookies or authentication headers
};

app.use(cors(corsOptions));
// Health check route
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT NOW()"); // Simple query to check the connection
    res.status(200).json({ message: "Database is connected" });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Don't forget to include this route in your main app file

setInterval(resetAppointmentCounts, 12 * 60 * 60 * 1000); // 12 hours
setInterval(deleteOldNotifications, 60 * 60 * 1000); // Every hour

app.listen(PORT, async () => {
  await initializeAdmin();
  await initializeManager();
  console.log(`Server running on port ${PORT}`);
});
