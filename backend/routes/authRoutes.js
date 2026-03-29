import { changePassword, forgotPassword, registerUser, userLogin } from "../controllers/authController.js";
import express from 'express';
import { authMiddleware } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", userLogin);
router.post("/forgot-password", forgotPassword);
router.put("/change-password",authMiddleware ,changePassword)

export default router
