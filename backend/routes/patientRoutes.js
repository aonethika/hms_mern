import express from "express";
import { authMiddleware } from "../middleware/verifyToken.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  createAppointmentPatient,
  getMyAppointments,
  getAppointmentDetails,
  cancelAppointment,
  rescheduleAppointment,
  getDoctorsByDepartment,
  getVisitHistory,
  getPrescriptionDetails,
  getMyPrescriptionHistory,
  getMyFollowUpsPatient,
  getMyNotifications,
  markNotificationRead,
  getMyProfile,
  updateMyProfile,
  getPatientDashboardStats,
  getMyPatients,
  createPatient,
  deletePatient,
  getAllAppointments,
  getPatientSlots,
  getUpcomingAppointments,
  markAllNotificationsRead,
  getDoctorAvailabilityByDate,
  getAllAvailableDoctorsByDatePatient
} from "../controllers/patientController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("patient"));

router.post("/new-patient", createPatient);
router.get("/my-patients", getMyPatients);
router.delete("/patients/:patientId", deletePatient);

router.post("/appointment", createAppointmentPatient);
router.get("/slots/:doctorId/:date", getPatientSlots);
router.get("/appointments", getAllAppointments)
router.get("/my-appointments", getMyAppointments);
router.get("/upcoming", getUpcomingAppointments);
router.get("/appointments/:appointmentId", getAppointmentDetails);
router.put("/appointments/:appointmentId/cancel", cancelAppointment);
router.put("/appointments/:appointmentId/reschedule", rescheduleAppointment);

// router.get("/doctors/available", getAvailableDoctors);

router.get("/doctors/:doctorId/availability", getDoctorAvailabilityByDate);

router.get("/doctors/department/:departmentId", getDoctorsByDepartment);

router.get("/visits", getVisitHistory);
router.get("/prescriptions", getMyPrescriptionHistory);
router.get("/prescriptions/:prescriptionId", getPrescriptionDetails);

router.get("/follow-ups", getMyFollowUpsPatient);

router.get("/notifications", getMyNotifications);
router.put("/notifications/:id/read", markNotificationRead);
router.put("/notifications/all", markAllNotificationsRead);

router.get("/profile", getMyProfile);
router.put("/edit-profile", updateMyProfile);

router.get("/dashboard", getPatientDashboardStats);

router.get("/doctors/avaialable",getAllAvailableDoctorsByDatePatient);

export default router;

