import express from "express";

import roleMiddleware from "../middleware/roleMiddleware.js";
import { authMiddleware } from "../middleware/verifyToken.js";
import { addStock, createMedicines, dispenseMedicine, editPharmacistProfile, generateBill, getAllBills, getBillByPrescriptionId, getBillStatus, getMedicines, getNotificationsPharmacist, getPendingPrescriptions, getPrescriptionMedicines, markAllNotificationsPharmacist, markBillPayment, markNotificationReadPharmacist } from "../controllers/pharmacyController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("pharmacist"))

router.put("/update",editPharmacistProfile);

router.post("/medicines", createMedicines);
router.get("/medicines", getMedicines);
router.get("/prescriptions/pending", getPendingPrescriptions);
router.post("/dispense", dispenseMedicine);
router.post("/bill/:prescriptionId", generateBill);
router.get("/prescription/:id/medicines", getPrescriptionMedicines);
router.patch("/bill/payment/:prescriptionId", markBillPayment);
router.get("/bill/:prescriptionId", getBillStatus);
router.get("/bills", getAllBills);
router.get("/bill/view/:prescriptionId", getBillByPrescriptionId);
router.patch("/medicines/:medicineId/stock", addStock);

router.get("/notifications",getNotificationsPharmacist);
router.put("/notifications/:id/read", markNotificationReadPharmacist);
router.put("/notifications/all", markAllNotificationsPharmacist);

export default router;