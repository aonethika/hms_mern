import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";

import startAppointmentReminder from "./services/appointmentRemainder.js";
import { startCronJobs } from "./cron/cronJobs.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://13.206.89.129",
      "http://13.206.89.129:3000",
      "http://localhost:3000"
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null, true);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("HIT:", req.method, req.url);
  next();
});

app.use("/api", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/public", publicRoutes);

app.get("/api/test", (req, res) => {
  res.send("Backend working");
});

const startServer = async () => {
  try {
    await connectDB();
    startCronJobs();
    startAppointmentReminder();
    app.listen(5000, "0.0.0.0", () => {
      console.log("Server running on port 5000 🚀");
    });
  } catch (error) {
    console.error("Server failed to start:", error);
  }
};

startServer();