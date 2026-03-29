import express from 'express';
import { authMiddleware } from '../middleware/verifyToken.js';
import { addDepartment, deleteDepartment, editDepartment, getAllDepartments } from '../controllers/departmentControllers.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();
router.use(authMiddleware)

router.post("/",roleMiddleware("admin"), addDepartment);
router.get("/", getAllDepartments)
router.put("/:id", roleMiddleware("admin"), editDepartment);
router.delete("/:id", roleMiddleware("admin"), deleteDepartment);

export default router