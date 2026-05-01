import {v4 as uuidv4} from "uuid"
import Prescription from "../models/Prescription.js";
import { createPool } from "../config/postgres.js";
import Notification from "../models/Notification.js";


 const pool = createPool();

const calculateTotalMedicines = (frequency, duration) => {
  if (!frequency) return 0;

  const parts = frequency.split("-").map(Number);
  const perDay =
    (parts[0] || 0) + (parts[1] || 0) + (parts[2] || 0);

  return perDay * (duration || 1);
};





// ------------------------------ADD MEDICINES---------------------------------
export const createMedicines = async (req, res) => {
  try {
    const medicines = req.body;

    const medsArray = Array.isArray(medicines) ? medicines : [medicines];

    const values = medsArray.map(med => [
      uuidv4(),
      med.name,
      med.price,
      med.stock || 0
    ]);

    const query = `
      INSERT INTO medicines (id, name, price, stock)
      VALUES ${values.map((_, i) => `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`).join(",")}
    `;

    const flatValues = values.flat();

    await pool.query(query, flatValues);

    res.json({ success: true, message: "Medicines added" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// -----------------------GET ALL MEDICINES----------------------------------------
export const getMedicines = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM medicines ORDER BY name");

    res.json({ success: true, medicines: result.rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// -----add stock-----

export const addStock = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity required",
      });
    }

    // check medicine exists
    const check = await pool.query(
      "SELECT * FROM medicines WHERE id = $1",
      [medicineId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    const result = await pool.query(
      `UPDATE medicines
       SET stock = stock + $1
       WHERE id = $2
       RETURNING *`,
      [quantity, medicineId]
    );

    return res.json({
      success: true,
      message: "Stock updated",
      medicine: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// -------------------------GET PENDING PRESCRIPTIONS ---------------------

export const getPendingPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
        status: "pending"
    })
        .populate({
        path: "patientId",
        select: "name phone patientId"
        })
        .populate({
        path: "doctorId",
        select: "name specialization"
        });

    res.json({ success: true, prescriptions });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};


export const dispenseMedicine = async (req, res) => {
  try {
    const { prescriptionId, medicineId, quantity } = req.body;

    if (!prescriptionId || !medicineId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

      const medicine = prescription.medicines.find(
        (m) => m.medicineId.toString() === medicineId.toString()
      );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    const required = calculateTotalMedicines(
      medicine.frequency,
      medicine.duration
    );

    const alreadyDispensed = medicine.dispensedCount || 0;

    const remaining = required - alreadyDispensed;

    if (quantity > remaining) {
      return res.status(400).json({
        success: false,
        message: "Cannot dispense more than remaining",
      });
    }

    // check stock
    const stockResult = await pool.query(
      "SELECT stock FROM medicines WHERE id = $1",
      [medicineId]
    );

    const stock = stockResult.rows[0]?.stock || 0;

    if (stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    medicine.dispensedCount =
      (medicine.dispensedCount || 0) + quantity;

    const updateResult = await pool.query(
  `UPDATE medicines 
   SET stock = stock - $1 
   WHERE id = $2 AND stock >= $1
   RETURNING stock, name`,
  [quantity, medicineId]
);

if (updateResult.rowCount === 0) {
  return res.status(400).json({
    success: false,
    message: "Insufficient stock",
  });
}

const { stock: updatedStock, name } = updateResult.rows[0];

if (updatedStock <= 5) {
  await Notification.create({
    message: `${name} stock is low (${updatedStock} left). Add stock soon.`,
    receiverRole: "pharmacist",
    receiver: req.user._id,
  });
}
    await prescription.save();

    return res.json({
      success: true,
      message: "Dispensed successfully",
      dispensedCount: medicine.dispensedCount,
      remaining:
        required - medicine.dispensedCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const generateBill = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("doctorId");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const doctorFee = prescription.doctorId?.consultationFee || 0;

    let medicineTotal = 0;

for (const med of prescription.medicines) {
  console.log("FULL MED OBJECT:", med);
  if (!med.dispensedCount || med.dispensedCount <= 0) continue;

  console.log("DISPENSED:", med.dispensedCount);

  console.log("QUERY ID:", med.medicineId);

  const result = await pool.query(
    "SELECT price FROM medicines WHERE id = $1",
    [med.medicineId]
  );
console.log("DB RESULT:", result.rows);
  const price = result.rows[0]?.price || 0;

  medicineTotal += price * med.dispensedCount;
}

const total = medicineTotal+ doctorFee

    prescription.bill = {
      doctorFee,
      medicineTotal,
      totalAmount: total,
      paymentStatus: "pending",
      status: "billed",
      billedAt: new Date(),
    };

    prescription.status = "billed";

    await prescription.save();

    return res.json({
      success: true,
      doctorFee,
      medicineTotal,
      totalAmount: total,
      prescription,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const getPrescriptionMedicines = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id)
      .populate("doctorId", "name")
      .populate("patientId", "name phone");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const medicines = await Promise.all(
      prescription.medicines.map(async (med) => {
        const requiredCount = calculateTotalMedicines(
          med.frequency,
          med.duration
        );

        const medId =
        typeof med.medicineId === "object"
          ? med.medicineId.toString()
          : med.medicineId;

          console.log("MED ID:", medId);

                const result = await pool.query(
          "SELECT stock, price FROM medicines WHERE id = $1",
          [medId]
        );

        const availableStock = result.rows[0]?.stock || 0;
        const price = result.rows[0]?.price || 0;
       

        const dispensedCount = med.dispensedCount || 0;

        return {
          medicineId: med.medicineId,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions,

          requiredCount,
          availableStock,
          price,
          dispensedCount,

          quantity: Math.min(requiredCount - dispensedCount, availableStock),

          isCompleted: dispensedCount >= requiredCount,
        };
      })
    );

    return res.json({
      success: true,
      prescriptionId: prescription._id,
      patient: prescription.patientId,
      doctor: prescription.doctorId,
      medicines,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getBillStatus = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("patientId", "name phone")
      .populate("doctorId", "name");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const bill = prescription.bill;

    if (!bill || bill.status !== "billed") {
      return res.status(400).json({
        success: false,
        message: "Bill not generated yet",
      });
    }

    return res.json({
      success: true,
      patient: prescription.patientId,
      doctor: prescription.doctorId,

      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount || 0,
      dueAmount:
        bill.dueAmount ??
        bill.totalAmount - (bill.paidAmount || 0),

      paymentStatus: bill.paymentStatus,
      billedAt: bill.billedAt,
      paidAt: bill.paidAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



export const markBillPayment = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount required",
      });
    }

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const bill = prescription.bill;

    if (!bill || bill.status !== "billed") {
      return res.status(400).json({
        success: false,
        message: "Bill not generated",
      });
    }

    const total = bill.totalAmount;
    const paidSoFar = bill.paidAmount || 0;
    const dueBefore = total - paidSoFar;

    if (amount > dueBefore) {
      return res.status(400).json({
        success: false,
        message: "Amount exceeds due",
      });
    }

    const newPaid = paidSoFar + amount;
    const due = total - newPaid;

    bill.paidAmount = newPaid;
    bill.dueAmount = due;

    if (due === 0) {
      bill.paymentStatus = "paid";
      bill.paidAt = new Date();
    } else {
      bill.paymentStatus = "partial";
    }

    await prescription.save();

    return res.json({
      success: true,
      message: "Payment recorded",
      paidAmount: bill.paidAmount,
      dueAmount: bill.dueAmount,
      paymentStatus: bill.paymentStatus,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


export const getAllBills = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      "bill.status": "billed",
    })
      .populate("patientId", "name phone")
      .populate("doctorId", "name")
      .sort({ createdAt: -1 });

    const bills = prescriptions.map((p) => ({
      prescriptionId: p._id,
      patient: p.patientId,
      doctor: p.doctorId,

      totalAmount: p.bill.totalAmount,
      paidAmount: p.bill.paidAmount || 0,
      dueAmount:
        p.bill.dueAmount ??
        p.bill.totalAmount - (p.bill.paidAmount || 0),

      paymentStatus: p.bill.paymentStatus,
      billedAt: p.bill.billedAt,
    }));

    res.json({ success: true, bills });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


export const getBillByPrescriptionId = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("patientId", "name phone")
      .populate("doctorId", "name consultationFee");

    if (!prescription) {
      return res.status(404).json({ success: false });
    }

    const bill = prescription.bill;

    return res.json({
      success: true,
      bill, 
      patient: prescription.patientId,
      doctor: prescription.doctorId,
      medicines: prescription.medicines, 
      prescriptionId: prescription._id,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


export const getNotificationsPharmacist = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { receiver: req.user._id },
        { receiver: null, receiverRole: "pharmacist" }
      ]
    })
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: unreadCount,
      notifications
    });
  } catch (err) {
    console.log("GET PHARMACIST NOTIFICATIONS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications"
    });
  }
};



export const markNotificationReadPharmacist = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { receiver: req.user._id },
          { receiver: null, receiverRole: "pharmacist" }
        ]
      },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });
  } catch (err) {
    console.log("MARK PHARMACIST NOTIFICATION ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update notification"
    });
  }
};

export const markAllNotificationsPharmacist = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        isRead: false,
        $or: [
          { receiver: req.user._id },
          { receiver: null, receiverRole: "pharmacist" }
        ]
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount
    });
  } catch (err) {
    console.log("MARK ALL PHARMACIST ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update notifications"
    });
  }
};