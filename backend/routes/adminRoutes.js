import express from 'express';
import { authMiddleware } from '../middleware/verifyToken.js';
import { addDoctors, adminDashboardStats, approveLeave, assignDoctorDepartment, checkDoctorAvailability, deactivateDoctor, deactivatePatient, deleteDoctor, getALLDoctorsAdmin, getAllLeaveRequests, getAllPatients, getAllPatientsMinimal, getDoctorById, getDoctorLeavesAdmin, getDoctorMonthlyAttendanceAdmin, getDoctorQueue, getNotificationsAdmin, getPatientById, getPrescriptionByAppointmentId, markAllNotificationsReadAdmin, markNotificationReadAdmin, patientRegistration, reactivateDoctor, rejectLeave, sendBroadcastNotification, updateDoctor, updateLeaveStatus } from '../controllers/adminController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { getPatientsByPhone } from '../controllers/appoinmentController.js';


const router = express.Router();

router.use(authMiddleware);

router.post("/doctor", roleMiddleware("admin"), addDoctors)
router.get("/doctors", roleMiddleware("admin"), getALLDoctorsAdmin)
router.get("/doctor/:doctorId", roleMiddleware("admin"), getDoctorById)
router.put("/doctor/:doctorId/update", updateDoctor)
router.put("/doctor/:doctorId/deactivate", roleMiddleware("admin"), deactivateDoctor);
router.put("/doctor/:doctorId/reactivate", roleMiddleware("admin"), reactivateDoctor);
router.delete("/doctor/:doctorId/delete", roleMiddleware("admin"), deleteDoctor);

router.get("/dashboard", roleMiddleware("admin"), adminDashboardStats)

router.post("/patient", roleMiddleware("admin"), patientRegistration);
router.get("/patients", roleMiddleware("admin"), getAllPatients);
router.get("/patients/minimal", roleMiddleware("admin"), getAllPatientsMinimal);
router.get("/patient/phone/:phone", roleMiddleware("admin"), getPatientsByPhone);
router.get("/patient/:patientId", roleMiddleware("admin"), getPatientById);
router.put("/patient/:patientId/deactivate", roleMiddleware("admin"), deactivatePatient);


router.put("/doctor/:doctorId/department", roleMiddleware("admin"), assignDoctorDepartment);
router.get("/doctor/:doctorId/queue",roleMiddleware("admin"),getDoctorQueue)

router.post("/broadcast", roleMiddleware("admin"), sendBroadcastNotification)

router.put("/leave-request",roleMiddleware("admin"), updateLeaveStatus );

router.get("/notifications",getNotificationsAdmin);
router.put("/notifications/:id/read", markNotificationReadAdmin);
router.put("/notifications/all", markAllNotificationsReadAdmin);

router.put("/leave/approve/:leaveId", approveLeave);
router.put("/leave/reject/:leaveId", rejectLeave);
router.get("/leave/all", getAllLeaveRequests);

router.get("/attendance/:doctorId",getDoctorMonthlyAttendanceAdmin);

router.get("/leaves/:doctorId", getDoctorLeavesAdmin);

router.get("/doctor/:id/availability", checkDoctorAvailability);

router.get("/prescription/:appointmentId", getPrescriptionByAppointmentId);


export default router