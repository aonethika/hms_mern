import dotenv from "dotenv";
dotenv.config();

import express from "express";

import connectDB from "./config/db.js";
import cors from "cors";
import { createPool } from "./config/postgres.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js"

import startAppointmentReminder from "./services/appointmentRemainder.js";
import { startCronJobs } from "./cron/cronJobs.js";


const app = express();


const allowed = [
  "http://13.206.89.129",
  "http://13.206.89.129:3000",
  "http://localhost:3000"
];
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

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
app.use("/api/pharmacy", pharmacyRoutes);

app.get("/api/test", (req, res) => {
  res.send("Backend working");
});

console.log("PG CONFIG:", {
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD,
  type: typeof process.env.DB_PASSWORD
});

const startServer = async () => {
  try {
    await connectDB();

    const pool = createPool(); 

    const res = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected:", res.rows);
    

    startCronJobs();
    startAppointmentReminder();
    app.listen(5000, "0.0.0.0", () => {
      console.log("Server running on port 5000");
    });
  } catch (error) {
    console.error("Server failed to start:", error);
  }
};

startServer();