import Appointment from "../models/Appointment.js";
import Leave from "../models/Leave.js";
import Notification from "../models/Notification.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import { getPatientAvailableSlots } from "../utils/slot.utils.js";
import mongoose from "mongoose";

// ------------------CREATE PATIENT--------------------------------------

export const createPatient = async (req, res) => {
  try {
    const userId = req.user._id;

   const user = await User.findById(userId);

    const phone = user.phone;
    const email = user.email

    const { name, dob, gender, bloodGroup } = req.body;

    if (!name || !gender) {
      return res.status(400).json({
        success: false,
        message: "Name and gender are required",
      });
    }

    const existingPatient = await Patient.findOne({ userId, name });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient already exists",
      });
    }

    const patient = await Patient.create({
      userId,
      name,
      dob,
      gender,
      bloodGroup,
      phone,
      email
    });

    res.status(201).json({
      success: true,
      message: "Patient added successfully",
      patient,
    });

  } catch (err) {
    console.log("CREATE PATIENT ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to create patient",
    });
  }
};

// -------------------GET LOGGED-IN PATIENTS-------------------------------
export const getMyPatients = async (req, res) => {
  try {
    const userId = req.user._id;

    const patients = await Patient.find({ userId })
    .populate("userId", "phone email")
    .sort({ createdAt: 1 })

    res.status(200).json({
      success: true,
      patients,
    });

  } catch (err) {
    console.log("GET MY PATIENTS ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
    });
  }
};

// -----------------create appoinment-----------------------------------
export const createAppointmentPatient = async (req, res) => {
  try {
    const userId = req.user._id;
    const { patientId, doctorId, departmentId, date, time, tokenType, source } = req.body;
    if (!patientId || !doctorId || !departmentId || !date || !time) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient || patient.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized patient access" });
    }

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    

    const selectedDate = new Date(date);
    const availableSlots = await getPatientAvailableSlots(doctorId, selectedDate);
    if (!availableSlots.includes(time)) {
      return res.status(400).json({ success: false, message: "Selected time slot not available" });
    }

    const [startTime, endTime] = time.split("-");

    const maxPerSlot = 3;
    const existingSlotBookings = await Appointment.countDocuments({
      doctorId,
      date: selectedDate,
      "timeSlot.startTime": startTime,
      "timeSlot.endTime": endTime,
      tokenType: "booked"
    });

    if (existingSlotBookings >= maxPerSlot) {
      return res.status(400).json({ success: false, message: "Selected time slot is full" });
    }

    const appointment = await Appointment.create({
      patientId,
      patient: {
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        gender: patient.gender,
        dob: patient.dob,
      },
      doctorId,
      departmentId,
      date: selectedDate,
      tokenType: tokenType || "booked",
      source: source || "online",
      timeSlot: { startTime, endTime },
      status: "scheduled",
      queueStatus: "waiting",
    });

    const admin = await User.findOne({
      role: "admin"
    });


    const message = `Your appointment has been booked successfully.

    Please confirm on the day of your appointment before arriving.

    Contact: ${admin.phone}

    Thank You`;

   const notification = await Notification.create({
      message,
      receiver: userId,
      receiverRole: "patient",
      appointmentId: appointment._id,
      type: "appointment",
      scheduledFor: new Date()
    });

    res.status(201).json({ success: true, message: "Appointment booked successfully", appointment,maxPerSlot, existingSlotBookings, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to book appointment" });
  }
};
// ---------------------------SLOTS-----------------------------------
export const getPatientSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    if (!doctorId || !date)
      return res.status(400).json({ success: false, message: "DoctorId and date required" });

    if (!mongoose.Types.ObjectId.isValid(doctorId))
      return res.status(400).json({ success: false, message: "Invalid doctorId" });

    const slotDate = new Date(date);
    if (isNaN(slotDate.getTime()))
      return res.status(400).json({ success: false, message: "Invalid date format" });

    const rawSlots = await getPatientAvailableSlots(doctorId, slotDate);

    const maxPerSlot = 3;

    const slots = await Promise.all(
      rawSlots.map(async (slot) => {
        const [startTime, endTime] = slot.split("-");

        const bookings = await Appointment.countDocuments({
          doctorId,
          date: slotDate,
          "timeSlot.startTime": startTime,
          "timeSlot.endTime": endTime,
          tokenType: "booked",
        });

        return {
          time: slot,
          bookings,
        };
      })
    );

    res.status(200).json({
      success: true,
      slots,
      maxPerSlot,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get slots" });
  }
};

// ------------------------GET ALL APPOINTMENTS -----------------------
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate("doctorId", "name specialization")
      .populate("patientId", "name email phone") 
      .populate("departmentId", "name")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (err) {
    console.log("GET ALL APPOINTMENTS ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all appointments",
    });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { patientId } = req.query; 

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required",
      });
    }

    // Verify patient belongs to user
    const patient = await Patient.findById(patientId);
    if (!patient || patient.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to patient",
      });
    }

    const appointments = await Appointment.find({
      patientId: patientId,
    })
      .populate("doctorId", "name specialization")
      .populate("departmentId", "name")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (err) {
    console.log("GET APPOINTMENTS ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
    });
  }
};

// ---------------------GET APPOINTMENT DETAILS-------------------------------

export const getAppointmentDetails = async (req, res) => {
  try {

    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorId", "name specialization consultationFee")
      .populate("departmentId", "name");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    const patient = await Patient.findById(appointment.patientId);

    if (!patient || patient.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    res.status(200).json({
      success: true,
      appointment
    });

  } catch (err) {

    console.log("GET APPOINTMENT DETAILS ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment details"
    });

  }
};

// ----------------------CANCEL APPOINTMENT--------------------------

export const cancelAppointment = async (req, res) => {
  try {

    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    const patient = await Patient.findById(appointment.patientId);

    if (!patient || patient.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized action"
      });
    }

    appointment.status = "cancelled";

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment
    });

  } catch (err) {

    console.log("CANCEL APPOINTMENT ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment"
    });

  }
};

// --------------------------RESCHEDULE--------------------------------------
export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newDate, timeSlot } = req.body;

    if (!newDate || !timeSlot?.startTime || !timeSlot?.endTime) {
      return res.status(400).json({ success: false, message: "Date and time slot are required" });
    }

    const appointment = await Appointment.findById(appointmentId).populate("patientId");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    if (appointment.patientId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (appointment.status !== "scheduled") {
      return res.status(400).json({ success: false, message: "Only scheduled appointments can be rescheduled" });
    }

    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(newDate);
    endOfDay.setHours(23, 59, 59, 999);

    const isLeave = await Leave.findOne({
      doctorId: appointment.doctorId,
      fromDate: { $lte: newDate },
      toDate: { $gte: newDate },
      status: "approved"
    });
    if (isLeave) {
      return res.status(400).json({ success: false, message: "Doctor is on leave on this date" });
    }

    const existingCount = await Appointment.countDocuments({
      doctorId: appointment.doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      "timeSlot.startTime": timeSlot.startTime,
      "timeSlot.endTime": timeSlot.endTime,
      status: "scheduled",
      _id: { $ne: appointmentId },
    });
    if (existingCount >= 3) {
      return res.status(400).json({ success: false, message: "Selected slot is full" });
    }

    appointment.date = new Date(newDate);
    appointment.timeSlot = { startTime: timeSlot.startTime, endTime: timeSlot.endTime };
    appointment.queueStatus = "waiting";

    await appointment.save();

    res.status(200).json({ success: true, message: "Appointment rescheduled", appointment });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to reschedule appointment" });
  }
};
// ------------------------GET AVAIABLE DOCTORS----------------------

// export const getAvailableDoctors = async (req, res) => {
//   try {

//     const doctors = await User.find({
//       role: "doctor",
//       isActive: true,
//       status: "available"
//     })
//     .select("name specialization consultationFee departmentId status")
//     .populate("departmentId", "name");

//     res.status(200).json({
//       success: true,
//       doctors
//     });

//   } catch (err) {

//     console.log("GET AVAILABLE DOCTORS ERROR:", err.message);

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch doctors"
//     });

//   }
// };


// ------------------AVAILABLE DOCTORS------------------------------

export const getDoctorsByDepartment = async (req, res) => {
  try {

    const { departmentId } = req.params;

    const doctors = await User.find({
      role: "doctor",
      departmentId,
      isActive: true
    })
    .select("name specialization consultationFee status")
    .populate("departmentId", "name");

    res.status(200).json({
      success: true,
      doctors
    });

  } catch (err) {

    console.log("GET DOCTORS BY DEPARTMENT ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors"
    });

  }
};

// --------------VISIT-HISTORY-----------------------------------

export const getVisitHistory = async (req, res) => {
  try {

    const userId = req.user._id;

    const patients = await Patient.find({ userId }).select("_id");

    const patientIds = patients.map(p => p._id);

    const visits = await Appointment.find({
      patientId: { $in: patientIds },
      status: "completed"
    })
    .populate("doctorId", "name specialization")
    .populate("departmentId", "name")
    .sort({ date: -1 });

    res.status(200).json({
      success: true,
      visits
    });

  } catch (err) {

    console.log("GET VISIT HISTORY ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch visit history"
    });

  }
};


// ------------------PRESCRIPTION-HISTORY-----------------------------------------------
export const getMyPrescriptionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const patientId = req.query.patientId;

    let patients = await Patient.find({ userId }).select("_id");
    if (patientId) {
      patients = patients.filter(p => p._id.toString() === patientId);
    }

    const patientIds = patients.map(p => p._id);

    const prescriptions = await Prescription.find({
      patientId: { $in: patientIds },
      isActive: true
    })
    .populate("doctorId", "name specialization")
    .populate("appointmentId", "date status")
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      prescriptions
    });

  } catch (err) {
    console.log("GET PRESCRIPTION HISTORY ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions"
    });
  }
};

// -----------------------PRESCRIPTION DETAILS-----------------------

export const getPrescriptionDetails = async (req, res) => {
  try {

    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("doctorId", "name specialization")
      .populate("appointmentId", "date status")
      .populate("patientId", "name dob gender");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found"
      });
    }

    const patient = await Patient.findById(prescription.patientId);

    if (!patient || patient.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    res.status(200).json({
      success: true,
      prescription
    });

  } catch (err) {

    console.log("GET PRESCRIPTION DETAILS ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch prescription details"
    });

  }
};

// -----------------MY FOLLOW UPS---------------------------------------

export const getMyFollowUpsPatient = async (req, res) => {
  try {

    const userId = req.user._id;

     const patientId = req.query.patientId;

    let patients = await Patient.find({ userId }).select("_id");
    if (patientId) {
      patients = patients.filter(p => p._id.toString() === patientId);
    }

    const patientIds = patients.map(p => p._id);

     const today = new Date();
      today.setHours(0, 0, 0, 0); 

    const followUps = await Appointment.find({
      patientId: { $in: patientIds },
      followUpRequired: true,
      date: {$gte: today}
    })

    .populate("doctorId", "name specialization")
    .populate("departmentId", "name")
    .sort({ followUpDate: 1 });

    res.status(200).json({
      success: true,
      followUps
    });

  } catch (err) {

    console.log("GET FOLLOWUPS ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch follow-ups"
    });

  }
};



export const getMyNotifications = async (req, res) => {
  
  try {
    const notifications = await Notification.find({
      receiver: req.user._id
    })
      .populate({
        path: "appointmentId",
        select: "date status patientId",
        populate: { path: "patientId", select: "name" }
      })
      .sort({ createdAt: -1 });

      const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      notifications,
      count: unreadCount
    });
  } catch (err) {
    console.log("GET NOTIFICATIONS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications"
    });
  }
};


export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { receiver: req.user._id },
          { receiver: null, receiverRole: "patient" }
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
    console.log("MARK NOTIFICATION READ ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update notification"
    });
  }
};



export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      {
        $or: [
          { receiver: userId },
          { receiver: null, receiverRole: "patient" }
        ],
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (err) {
    console.log("MARK ALL NOTIFICATIONS READ ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read"
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (err) {
    console.log("GET PROFILE ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};



export const updateMyProfile = async (req, res) => {
  try {
    const patientId = req.query.patientId;
    const { name, dob, gender, phone, bloodGroup, place } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: "Patient ID is required" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    if (name) patient.name = name;
    if (dob) patient.dob = new Date(dob);
    if (gender) patient.gender = gender;
    if (phone) patient.phone = phone;
    if (bloodGroup) patient.bloodGroup = bloodGroup;
    if (place) patient.place = place;

    await patient.save();

    res.status(200).json({
      success: true,
      message: "Patient profile updated successfully",
      patient,
    });

  } catch (err) {
    console.error("UPDATE PATIENT ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to update patient profile" });
  }
};



export const getPatientDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({ success: false, message: "Patient ID required" });
    }

    const patient = await Patient.findOne({ _id: patientId, userId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

const upcomingAppointments = await Appointment.countDocuments({
  patientId,
  date: { $gte: startOfToday },
  status: "scheduled",
});

  

    const followUps = await Appointment.countDocuments({
      patientId,
      followUpRequired: true,
    });

    const visits = await Appointment.countDocuments({
      patientId,
      status: "completed",
    });

    const prescriptions = await Prescription.countDocuments({
      patientId,
      isActive: true,
    });

    const notifications = await Notification.countDocuments({
      $or: [
        { receiver: userId },
        { receiverRole: "patient" },
        { receiverRole: "all" },
        
      ],
      isRead: false,
    });

    const lastVisit = await Appointment.findOne({
      patientId,
      status: "completed",
    })
      .populate("doctorId", "name")
      .populate("departmentId", "name")
      .sort({ date: -1 });

    const nextAppointment = await Appointment.findOne({
      patientId,
      status: "scheduled",
      date: { $gte: startOfToday },
    })
      .populate("doctorId", "name")
      .populate("departmentId", "name");

    res.status(200).json({
      success: true,
      stats: {
        upcomingAppointments,
        followUps,
        visits,
        prescriptions,
        notifications,
      },
      lastVisit: lastVisit || null,
      nextAppointment: nextAppointment || null,
    });
  } catch (err) {
    console.log("PATIENT DASHBOARD STATS ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};


// ------------------DELETE PATIENT--------------------------------
export const deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user._id;

    const patient = await Patient.findById(patientId);

    if (!patient || patient.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized or patient not found"
      });
    }

   
    const existingAppointments = await Appointment.findOne({ patientId: patient._id });
    if (existingAppointments) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete patient with existing appointments"
      });
    }

    await patient.deleteOne();

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully"
    });

  } catch (err) {
    console.log("DELETE PATIENT ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete patient"
    });
  }
};


export const getUpcomingAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { patientId } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const upcomingAppointments = await Appointment.find({
      patientId,
      status: "scheduled",
      date: { $gte: today },
    }).populate("doctorId", "name").populate("departmentId", "name");

    return res.status(200).json({
      success: true,
      message: upcomingAppointments.length ? "Appointments found" : "No appointments found",
      appointments: upcomingAppointments,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



export const getDoctorAvailabilityByDate = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ success: false, message: "Date is required" });
    if (!mongoose.Types.ObjectId.isValid(doctorId))
      return res.status(400).json({ success: false, message: "Invalid doctorId" });

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime()))
      return res.status(400).json({ success: false, message: "Invalid date format" });

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    if (!doctor.isActive || doctor.status === "on_leave") {
      return res.status(200).json({ success: true, available: false, date, status: doctor.status });
    }

    const leave = await Leave.findOne({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      fromDate: { $lte: endOfDay },
      toDate: { $gte: startOfDay },
    });

    if (leave) {
      return res.status(200).json({ success: true, available: false, date, status: "on_leave" });
    }

    res.status(200).json({ success: true, available: true, date, status: doctor.status });

  } catch (err) {
    console.log("GET AVAILABILITY ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to get availability" });
  }
};



export const getAllAvailableDoctorsByDatePatient = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) return res.status(400).json({ success: false, message: "Date is required" });

    const selectedDate = new Date(date + "T00:00:00.000Z");
    if (isNaN(selectedDate.getTime()))
      return res.status(400).json({ success: false, message: "Invalid date format" });

    const doctors = await User.find({role: "doctor" })
      .populate("departmentId", "name")
   
    const availableDoctors = [];

    const startOfDay = new Date(date + "T00:00:00.000Z");
    const endOfDay = new Date(date + "T23:59:59.999Z");

    

    for (const doc of doctors){
      const leave = await Leave.findOne({
        doctorId: doc._id,
        status: "approved",
        fromDate: { $lte: endOfDay },
        toDate: { $gte: startOfDay }
      });
      if(!leave){
        availableDoctors.push({
          doctorId: doc._id,
          doctorName: doc.name,
          consultationFee: doc.consultationFee,
          qualifications: doc.qualification,
          specialization: doc.specialization,
          departmentId: doc.departmentId,
          departmentName: doc.departmentId?.name,
          status: "Available"
        })
      }
       console.log("Selected date:", selectedDate);
    console.log("Doctor:", doc.name, "Leave found:", leave);
    }

   
   return res.status(200).json({
      success: true,
      data: availableDoctors,
    });
  } catch (err) {
    console.log("GET AVAILABILITY ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to get availability" });
  }
};