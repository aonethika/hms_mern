
import Appointment from "../models/Appointment.js";
import Leave from "../models/Leave.js";
import Notification from "../models/Notification.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js"

// -----------------GET PATIENTS OF A DOCTOR FOR DOCTORS------------------------------

export const getMyPatients = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const appointments = await Appointment.find({
      doctorId,
      status: "completed"
    })
      .populate("patientId", "name phone gender dob age")
      .select("patient patientId");

    const uniquePatients = [];
    const seen = new Set();

    appointments.forEach(app => {
      const id = app.patientId?._id?.toString() || app.patient?.phone;

      if (!seen.has(id)) {
        seen.add(id);
        uniquePatients.push(app.patientId || app.patient);
      }
    });

    res.status(200).json({
      success: true,
      patients: uniquePatients
    });

  } catch (err) {
    console.log("FETCHING MY PATIENT ERROR", err);
    res.status(500).json({ success: false });
  }
};



// ----------------------GET TODAY APPOINTMNETS--------------------
export const getAppointmentsByDateAndStatus = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { date, status } = req.query;

    let query = { doctorId, token: { $ne: null } };

    const filterDate = date ? new Date(date) : new Date();
    const start = new Date(filterDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filterDate);
    end.setHours(23, 59, 59, 999);

    query.date = { $gte: start, $lte: end };

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate("patientId", "name phone gender")
      .populate("departmentId", "name")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      message: "Appointments fetched successfully",
      count: appointments.length,
      appointments,
    });
  } catch (err) {
    console.log("GET APPOINTMENTS ERROR", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

// ---------------------TODAY QUEUE----------------------------------------
export const getDoctorTodayQueue = async (req, res) => {
  try {
    const doctorId = req.user._id;
    if (!doctorId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const now = new Date();

    const todayAppointments = await Appointment.find({
      doctorId,
      date: { $gte: start, $lte: end },
      status: "scheduled",
      token: { $ne: null }
    })
      .populate("patientId", "name phone gender")
      .sort({ tokenNumber: 1 });

    let current = todayAppointments.find(appt => appt.queueStatus === "in_consultation");

    const bookedWaiting = todayAppointments.filter(appt => appt.queueStatus === "waiting" && appt.tokenType === "booked");
    const walkInWaiting = todayAppointments.filter(appt => appt.queueStatus === "waiting" && appt.tokenType !== "booked");

    let bookedReady = bookedWaiting.filter(appt =>
      appt.timeSlot?.startTime &&
      now >= new Date(new Date(appt.date).setHours(...appt.timeSlot.startTime.split(":").map(Number)))
    );

    if (!current) {
      if (walkInWaiting.length > 0) {
        current = walkInWaiting[0];
        current.queueStatus = "in_consultation";
        await current.save();
      } else if (bookedReady.length > 0) {
        current = bookedReady[0];
        current.queueStatus = "in_consultation";
        await current.save();
      } else if (bookedWaiting.length > 0) {
        current = bookedWaiting[0]; // allow booked patient early if queue empty
        current.queueStatus = "in_consultation";
        await current.save();
      }
    }

    const waiting = [
      ...walkInWaiting.filter(appt => appt._id.toString() !== current?._id.toString()),
      ...bookedWaiting.filter(appt => appt._id.toString() !== current?._id.toString())
    ];

    let nextPatient = waiting.length > 0 ? waiting[0] : null;

    const formatPatient = (appt) => {
      if (!appt) return null;
      const obj = appt.toObject();
      obj.patient = obj.patientId;
      return obj;
    };

    return res.status(200).json({
      success: true,
      inConsultation: formatPatient(current),
      nextPatient: formatPatient(nextPatient),
      waiting: waiting.map(formatPatient)
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// --------------------------START CONSULATION-------------------------

export const startConsultation = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        doctorId,
        queueStatus: "waiting"
      },
      {
        queueStatus: "in_consultation"
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      appointment
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// -------------------COMPLETE---------------------------------------------
export const completeAppointmentByDoctor = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { appointmentId } = req.params;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        doctorId,
        status: "scheduled",
        queueStatus: "in_consultation"
      },
      {
        status: "completed",
        queueStatus: "done"
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Active appointment not found"
      });
    }

    await Appointment.updateMany(
      {
        doctorId,
        date: { $gte: start, $lte: end },
        queueStatus: "in_consultation"
      },
      {
        queueStatus: "waiting"
      }
    );

    const nextPatient = await Appointment.findOne({
      doctorId,
      date: { $gte: start, $lte: end },
      status: "scheduled",
      queueStatus: "waiting",
      token: { $ne: null }
    }).sort({ tokenNumber: 1 });

    if (nextPatient) {
      nextPatient.queueStatus = "in_consultation";
      await nextPatient.save();
    }

    res.status(200).json({
      success: true,
      message: "Appointment completed",
      appointment,
      nextPatient
    });

  } catch (err) {
    console.error("COMPLETE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to complete appointment"
    });
  }
};


//------------------------follow-up--------------------------------
export const doctorMarkFollowUp = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { appointmentId } = req.params;
    const { followUpDate, notes } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
      status: "completed"
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or not completed"
      });
    }

    const existing = await Appointment.findOne({
    parentAppointmentId: appointmentId
    });

    if (existing) {
      return res.status(400).json({
        success:false,
        message:"Follow-up already created"
      });
    }
    const followUpAppointment = await Appointment.create({
      patientId: appointment.patientId,
      patient: appointment.patient,
      doctorId: appointment.doctorId,
      departmentId: appointment.departmentId,
      date: followUpDate,
      notes,
      status: "scheduled",
      isFollowUp: true,
      parentAppointmentId: appointment._id
    });

    res.status(201).json({
      success: true,
      message: "Follow-up created successfully",
      appointment: followUpAppointment
    });

  } catch (err) {
    console.error("DOCTOR FOLLOWUP ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create follow-up"
    });
  }
};


export const createPrescription = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { appointmentId } = req.params;
    const { diagnosis, notes, advice, medicines, followUpDate } = req.body;

    const doctor = await User.findById(doctorId);

    if (!diagnosis || !medicines?.length) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis and medicines required"
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment || appointment.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized or appointment not found"
      });
    }

    const existingPrescription = await Prescription.findOne({ appointmentId });

    if (existingPrescription) {
      return res.status(400).json({
        success: false,
        message: "Prescription already exists"
      });
    }

    const patient = await Patient.findById(appointment.patientId);

    const prescription = await Prescription.create({
      doctorId,
      patientId: appointment.patientId,
      appointmentId,
      diagnosis,
      notes,
      advice,
      medicines,
      followUp: !!followUpDate,
      followUpDate,
    });

    appointment.status = "completed";
    appointment.queueStatus = "done";
    appointment.prescriptionId = prescription._id;
    await appointment.save();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const now = new Date();

    const waitingRaw = await Appointment.find({
      doctorId,
      date: { $gte: start, $lte: end },
      status: "scheduled",
      queueStatus: "waiting",
      token: { $ne: null }
    }).sort({ tokenNumber: 1 });

  

    const bookedWaiting = waitingRaw.filter(appt => appt.tokenType === "booked");
    const walkInWaiting = waitingRaw.filter(appt => appt.tokenType !== "booked");

    const bookedReady = bookedWaiting.filter(appt =>
      appt.timeSlot?.startTime &&
      now >= new Date(
        new Date(appt.date).setHours(
          ...appt.timeSlot.startTime.split(":").map(Number)
        )
      )
    );

    let nextPatient = null;

    if (bookedReady.length > 0) {
      nextPatient = bookedReady[0];
    } else if (walkInWaiting.length > 0) {
      nextPatient = walkInWaiting[0];
    }


    if (nextPatient) {
      nextPatient.queueStatus = "in_consultation";
      nextPatient.arrivalTime = new Date();
      await nextPatient.save();
    }

    if (followUpDate) {
      await Appointment.create({
        patientId: appointment.patientId,
        patient: appointment.patient,
        doctorId: appointment.doctorId,
        departmentId: appointment.departmentId,
        date: followUpDate,
        status: "scheduled",
        followUpRequired: true,
        parentAppointmentId: appointment._id
      });

      await Notification.create({
        message: `You have a follow-up on ${followUpDate} with Dr.${doctor.name}`,
        receiver: patient.userId,
        receiverRole: "patient",
        appointmentId: appointment._id,
        prescriptionId: prescription._id,
        type: "prescription",
      });
    }

    if (patient.userId) {
      await Notification.create({
        message: "Click here to see your prescription",
        receiver: patient.userId,
        receiverRole: "patient",
        appointmentId: appointment._id,
        prescriptionId: prescription._id,
        type: "prescription",
      });
    }

    return res.status(201).json({
      success: true,
      prescription
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};


export const getMyProfileDoctor = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" })
      .select("-password")
      .populate("departmentId", "name");

    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    res.status(200).json({ success: true, doctor });
  } catch (err) {
    console.error("GET MY PROFILE ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

// -------------------------UPDATE PROFILE----------------------------

export const updateDoctorSelf = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const updateData = req.body;

    if (updateData.workingHours) {
      const { startTime, endTime } = updateData.workingHours;
      if (startTime && endTime && startTime >= endTime) {
        return res.status(400).json({ success: false, message: "Start time must be before end time" });
      }
    }

    const doctor = await User.findOneAndUpdate(
      { _id: doctorId, role: "doctor" },
      updateData,
      { new: true, runValidators: true }
    ).populate("departmentId", "name").select("-password");

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    res.status(200).json({ success: true, doctor });
  } catch (err) {
    console.error("UPDATE DOCTOR PROFILE ERROR:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const skipCurrentPatientByDoctor = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const now = new Date();

    const current = await Appointment.findOne({
      doctorId,
      date: { $gte: start, $lte: end },
      status: "scheduled",
      queueStatus: "in_consultation"
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "No active patient to skip"
      });
    }

    current.status = "no_show";
    current.queueStatus = "no_show";
    await current.save();

    const waitingRaw = await Appointment.find({
      doctorId,
      date: { $gte: start, $lte: end },
      status: "scheduled",
      queueStatus: "waiting",
      token: { $ne: null }
    }).sort({ tokenNumber: 1 });

    // 🔥 Split properly
    const bookedWaiting = waitingRaw.filter(appt => appt.tokenType === "booked");
    const walkInWaiting = waitingRaw.filter(appt => appt.tokenType !== "booked");

    // 🔥 Only allow booked when time reached
    const bookedReady = bookedWaiting.filter(appt =>
      appt.timeSlot?.startTime &&
      now >= new Date(
        new Date(appt.date).setHours(
          ...appt.timeSlot.startTime.split(":").map(Number)
        )
      )
    );

    let nextPatient = null;

    if (bookedReady.length > 0) {
      nextPatient = bookedReady[0];
    } else if (walkInWaiting.length > 0) {
      nextPatient = walkInWaiting[0];
    }

    if (nextPatient) {
      nextPatient.queueStatus = "in_consultation";
      nextPatient.arrivalTime = new Date();
      await nextPatient.save();
    }

    return res.status(200).json({
      success: true,
      message: "Current patient skipped"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};
// ---------------GET PRESCRIPTION BY ID-----------------------

export const getPrescriptionById = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("patientId", "name phone dob gender")
      .populate("doctorId", "name");

    if (!prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    res.status(200).json({
      success: true,
      prescription,
    });
  } catch (err) {
    console.error("GET PRESCRIPTION ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch prescription" });
  }
};
//------------------GET OLD PRESCRIOTION-------------------------------

export const getPatientMedicalHistory = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { patientId } = req.params;

    const prescriptions = await Prescription.find({
      patientId,
    })
      .populate("appointmentId", "date")
      .populate("doctorId", "name specialization")
      .populate("patientId", "name age gender phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      prescriptions
    });

  } catch (err) {
    console.error("PATIENT HISTORY ERROR:", err);
    res.status(500).json({ success: false });
  }
};


//------------------------------DOCTOR DASHBOARD STATS---------------------------
export const getDoctorDashboardStats = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    const totalToday = await Appointment.countDocuments({
      doctorId,
      date: { $gte: start, $lte: end },
       token: { $ne: null }
    });

    const completedToday = await Appointment.countDocuments({
      doctorId,
      status: "completed",
      date: { $gte: start, $lte: end },
       token: { $ne: null }
    });

    const pendingToday = await Appointment.countDocuments({
      doctorId,
      status: "scheduled",
      date: { $gte: start, $lte: end },
      token: { $ne: null }
    });

    const followUpsToday = await Appointment.countDocuments({
      doctorId,
      isFollowUp: true,
      date: { $gte: start, $lte: end }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalToday,
        completedToday,
        pendingToday,
        followUpsToday
      }
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

//-------------------GET FOLLOW-UPS--------------------------
export const getMyFollowUpsDoctor = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const followUps = await Appointment.find({
      doctorId,
      isFollowUp: true,
      status: "scheduled"
    })
      .populate("patientId", "name phone gender")
      .populate("departmentId", "name")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: followUps.length,
      followUps
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ---------------------UPDATE AVAILABILITY-----------------------------
export const updateDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { status } = req.body;

    const doctor = await User.findOneAndUpdate(
      { _id: doctorId, role: "doctor" },
      { status },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      doctor
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ---------------------------GET APPOINTMENTS BY STATUS---------------------------------

export const getDoctorAppointmentsByStatus = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { status } = req.query;

    const appointments = await Appointment.find({
      doctorId,
      status
    })
      .populate("patientId", "name phone gender")
      .populate("departmentId", "name")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      appointments
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};
// -----Patient info---------------------------------------------------------------------------
export const getPatientByAppointmentId = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user._id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
    }).populate("patientId", "name email phone gender dob age")
    .populate("doctorId", "name specialization qualification")

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found for this doctor",
      });
    }

    res.status(200).json({
      success: true,
      patient: appointment.patientId || appointment.patient,
      appointment,
    });
  } catch (err) {
    console.error("GET PATIENT BY APPOINTMENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
    });
  }
};


export const requestLeave = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { fromDate, toDate, reason } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "From date and To date are required",
      });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    const overlappingLeave = await Leave.findOne({
      doctorId,
      status: { $in: ["pending", "approved"] },
      $or: [
        {
          fromDate: { $lte: new Date(toDate) },
          toDate: { $gte: new Date(fromDate) },
        },
      ],
    })

    const doctor = await User.findById(doctorId);


    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: "Leave already exists for selected dates",
      });
    }

    const leave = await Leave.create({
      doctorId,
      fromDate,
      toDate,
      reason,
    });


    const admin = await User.findOne({
      role: "admin"
    });

        const message = `Dr.${doctor.name} has requested leave from ${fromDate} to ${toDate}`
    if (!admin) {
      console.error("No admin found to send notification");
    } else {
      const notification = await Notification.create({
        message,
        receiverRole: "admin",
        receiver: admin._id,
        leaveId: leave._id,
        type: "leave",
        createdBy: doctorId
      });
      console.log("Notification created:", notification);
    }

    res.status(201).json({
      success: true,
      message: "Leave request submitted",
      leave,
    });
  } catch (err) {
    console.error("REQUEST LEAVE ERROR:", err);
    res.status(500).json({ success: false });
  }
};


export const getDoctorMonthlyAttendance = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { month, year } = req.query;

if (!month || !year) {
  return res.status(400).json({ success: false, message: "Month and year required" });
}

const m = Number(month);
const y = Number(year);

if (isNaN(m) || isNaN(y)) {
  return res.status(400).json({ success: false, message: "Invalid month or year" });
}

const start = new Date(y, m - 1, 1);
const end = new Date(y, m, 0);
    const appointments = await Appointment.find({
      doctorId,
      status: "completed",
      date: { $gte: start, $lte: end },
    }).select("date");

    const leaves = await Leave.find({
      doctorId,
      status: "approved",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    const workedSet = new Set(
      appointments
        .map(a => a.date && new Date(a.date).toDateString())
        .filter(Boolean)
    );

    const leaveSet = new Set();

    leaves.forEach(l => {
      let d = new Date(l.fromDate);
      const last = new Date(l.toDate);

      while (d <= last) {
        leaveSet.add(new Date(d).toDateString());
        d.setDate(d.getDate() + 1);
      }
    });

    const days = [];
    let current = new Date(start);

    while (current <= end) {
      const dateStr = current.toDateString();

      let status = "absent";

      if (leaveSet.has(dateStr)) status = "leave";
      else if (workedSet.has(dateStr)) status = "worked";

      days.push({
        date: new Date(current),
        status,
      });

      current.setDate(current.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      days,
    });
  } catch (err) {
    console.log("ATTENDANCE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


export const cancelLeave = async (req, res) => {
  try {

    console.log("USER:", req.user);
    const doctorId = req.user._id;
    const { leaveId } = req.params;

    console.log("LEAVE ID", leaveId);
    

    const leave = await Leave.findOne({
      _id: leaveId,
      doctorId,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel rejected leave",
      });
    }

    if (
      leave.status === "approved" &&
      new Date(leave.fromDate) <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Leave already started",
      });
    }

    leave.status = "cancelled";
    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave cancelled successfully",
    });
  } catch (err) {
    console.error("CANCEL LEAVE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getDoctorLeaves = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const leaves = await Leave.find({ doctorId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leaves,
    });
  } catch (err) {
    console.error("GET DOCTOR LEAVES ERROR:", err);
    res.status(500).json({ success: false });
  }
};



export const getNotificationsDoctor = async (req, res) => {
  
  try {
    const notifications = await Notification.find({
      receiver: req.user._id
    })
      .populate({
        path: "leaveId",
        select: "doctorId fromDate toDate"
      })
      .sort({ createdAt: -1 });

       const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: unreadCount,
      notifications
    });
  } catch (err) {
    console.log("GET NOTIFICATIONS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications"
    });
  }
};



export const markNotificationReadDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { receiver: req.user._id },
          { receiver: null, receiverRole: "doctor" }
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



export const markAllNotificationsReadDoctor = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      {
        $or: [
          { receiver: userId },
          { receiver: null, receiverRole: "doctor" }
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




