import express from 'express';
import { authMiddleware } from '../middleware/verifyToken.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import {cancelAppointment, completeAppointment, createAppointmentByAdmin, fecthAllAppointments, generateToken, getAppointmentById, getCompletedAppointments, getDoctorAppointments, getPatientWithAppointments, getRemainingAppointments, skipPatient } from '../controllers/appoinmentController.js';

const router = express.Router();
router.use(authMiddleware);

router.post("/", roleMiddleware("admin"), createAppointmentByAdmin);
router.get("/patient-history/:id",roleMiddleware("admin"),getPatientWithAppointments);
router.get("/:appointmentId/token", roleMiddleware("admin"), generateToken);

router.get("/remaining",getRemainingAppointments)

router.get("/completed",getCompletedAppointments)

router.patch("/:appointmentId/skip", roleMiddleware("admin"), skipPatient);
router.put("/cancel/:appointmentId", cancelAppointment);

router.put("/complete/:appointmentId", completeAppointment);

router.get("/", roleMiddleware("admin"), fecthAllAppointments);
router.get("/:appointmentId",roleMiddleware("admin"), getAppointmentById);
router.get("/:doctorId", roleMiddleware("admin"), getDoctorAppointments);






export default router


