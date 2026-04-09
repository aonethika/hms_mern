import express from "express";
import { authMiddleware } from "../middleware/verifyToken.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  cancelAppointment,
  completeAppointment,
  createAppointmentByAdmin,
  fecthAllAppointments,
  generateToken,
  getAppointmentById,
  getCompletedAppointments,
  getDoctorAppointments,
  getOnlineBookings,
  getPatientWithAppointments,
  getRemainingAppointments,
  markNoShowInternal,
  skipPatient,
} from "../controllers/appoinmentController.js";

const router = express.Router();


router.get("/test-no-show", async (req, res) => {
  await markNoShowInternal();
  res.send("Ran manually");
});

router.use(authMiddleware);

router.post("/", roleMiddleware("admin"), createAppointmentByAdmin);

router.get("/all", roleMiddleware("admin"), fecthAllAppointments);

router.get("/online",getOnlineBookings)

router.get("/remaining", roleMiddleware("admin"), getRemainingAppointments);

router.get("/completed", roleMiddleware("admin"), getCompletedAppointments);

router.get("/patient-history/:id", roleMiddleware("admin"), getPatientWithAppointments);

router.get("/:appointmentId/token", roleMiddleware("admin"), generateToken);

router.patch("/:appointmentId/skip", roleMiddleware("admin"), skipPatient);

router.put("/cancel/:appointmentId", roleMiddleware("admin"), cancelAppointment);

router.put("/complete/:appointmentId", roleMiddleware("admin"), completeAppointment);

router.get("/doctor", roleMiddleware("admin"), getDoctorAppointments);

router.get("/:appointmentId", roleMiddleware("admin"), getAppointmentById);



export default router;