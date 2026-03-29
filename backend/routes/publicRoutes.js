import express from 'express';
import { authMiddleware } from '../middleware/verifyToken.js';
import { getAllDepartments, getALLDoctors, getDoctorsByDepartment, getDoctorStatus } from '../controllers/publicController.js';

const router = express.Router();
router.use(authMiddleware)

router.get("/doctors", getALLDoctors);
router.get("/departments", getAllDepartments);
router.get("/:departmentId/doctors", getDoctorsByDepartment)
router.get("/status", getDoctorStatus)


export default router;
