import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from 'cors';
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import departmentRoutes from './routes/departmentRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import publicRoutes from './routes/publicRoutes.js'
import patientRoutes from './routes/patientRoutes.js'

import startAppointmentReminder from "./services/appointmentRemainder.js";
import { startCronJobs } from "./cron/cronJobs.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: "http://13.206.89.129",
  credentials: true
}));
app.use(express.json());


app.use((req, res, next) => {
  console.log("REQUEST HIT:", req.method, req.originalUrl);
  next();
});

app.use((req, res, next) => {
  console.log("🌍 Incoming:", req.method, req.url);
  next();
});



app.use("/api", authRoutes);

app.use("/api/patient", patientRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/appointments", appointmentRoutes)
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
    app.listen(5000, () =>
      console.log("Server running on port 5000 🚀")
    );
  } catch (error) {
    console.error("Server failed to start:", error);
  }
};

startServer();