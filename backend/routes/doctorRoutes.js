import express from "express";
import { authMiddleware } from "../middleware/verifyToken.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  cancelLeave,
  completeAppointmentByDoctor,
  createPrescription,
  doctorMarkFollowUp,
  getDoctorAppointmentsByStatus,
  getDoctorDashboardStats,
  getDoctorLeaves,
  getDoctorMonthlyAttendance,
  getDoctorTodayQueue,
  getMyFollowUpsDoctor,
  getMyPatients,
  getNotificationsDoctor,
  getPatientByAppointmentId,
  getPatientMedicalHistory,
  getPrescriptionById,
  getTodayAppointments,
  markAllNotificationsReadDoctor,
  markNotificationReadDoctor,
  requestLeave,
  skipCurrentPatientByDoctor,
  startConsultation,
  updateDoctorAvailability
} from "../controllers/doctorController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("doctor"));

router.get("/my-patients", getMyPatients);

router.get("/appointments/today", getTodayAppointments);

router.get("/queue/today", getDoctorTodayQueue);

router.put("/appointment/:appointmentId/start", startConsultation);

router.patch("/complete/:appointmentId", completeAppointmentByDoctor);

router.patch("/skip-current", skipCurrentPatientByDoctor);

router.put("/appointment/:appointmentId/follow-up", doctorMarkFollowUp);

router.post("/appointment/:appointmentId/prescription", createPrescription);

router.get("/prescription/:prescriptionId", getPrescriptionById)

router.get("/history/:patientId", getPatientMedicalHistory);

router.get("/patient/:appointmentId", getPatientByAppointmentId);

router.get("/dashboard", getDoctorDashboardStats);

router.get("/follow-ups", getMyFollowUpsDoctor);

router.put("/availability", updateDoctorAvailability);

router.get("/appointments", getDoctorAppointmentsByStatus);


router.post("/leave-request", requestLeave)

router.post("/attendance", getDoctorMonthlyAttendance);

router.put("/leave/cancel/:leaveId", cancelLeave);

router.get("/leave/my", getDoctorLeaves);

router.get("/notifications",getNotificationsDoctor);
router.put("/notifications/:id/read", markNotificationReadDoctor);
router.put("/notifications/all", markAllNotificationsReadDoctor);




export default router;