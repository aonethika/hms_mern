import User from "../models/User.js";
import Department from "../models/Department.js";
import argon2 from "argon2";
import crypto from "crypto";
import {sendEmailAccountCreated, sendEmailAppointmentAffectedByDoctorLeave } from "../utils/senEmail.js";
import { sendSMS } from "../utils/sendSMS.js";
import Leave from "../models/Leave.js";
import { flushCompileCache } from "module";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import Notification from "../models/Notification.js";


// ----------------------------- ADD DOCTOR -----------------------------
export const addDoctors = async (req, res) => {
  try {
    const {
      name,
      email,
      gender,
      phone,
      specialization,
      qualification,
      departmentId,
      consultationFee,
      workingHours,  
    } = req.body;

    if (!name || !email || !specialization || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Doctor already exists" });

    const department = await Department.findById(departmentId);
    if (!department)
      return res
        .status(404)
        .json({ success: false, message: "Invalid department" });

    const password = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await argon2.hash(password);

    const doctor = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      gender,
      role: "doctor",
      specialization,
      qualification,
      departmentId,
      consultationFee,
      isActive: true,
      status: "available",
      workingHours: workingHours || { startTime: "10:00", endTime: "17:00" },
    });

    await sendEmailAccountCreated(email, name, password);

    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      doctor: doctorResponse,
    });
  } catch (err) {
    console.error("ADD DOCTOR ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add doctor",
    });
  }
};


// ----------------------------- GET ALL DOCTORS (ADMIN) -----------------------------
export const getALLDoctorsAdmin = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" })
      .select("-password")
      .populate("departmentId", "name");

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (err) {
    console.error("GET DOCTORS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
};

// ----------------------------- UPDATE DOCTOR -----------------------------
export const updateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { workingHours } = req.body;

    if (workingHours) {
      const { startTime, endTime } = workingHours;
      if (startTime && endTime && startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: "Start time must be earlier than end time",
        });
      }
    }

    const doctor = await User.findOneAndUpdate(
      { _id: doctorId, role: "doctor" },
      req.body,
      { returnDocument: "after", runValidators: true }
    )
      .select("-password")
      .populate("departmentId", "name");

    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      doctor,
    });
  } catch (err) {
    console.error("UPDATE DOCTOR ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update doctor",
    });
  }
};
// ----------------------------- GET DOCTOR BY ID -----------------------------
export const getDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findOne({
      _id: doctorId,
      role: "doctor",
    })
      .select("-password")
      .populate("departmentId", "name");

    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (err) {
    console.error("GET DOCTOR ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor",
    });
  }
};

// -------------------DEACTIVATE DOCTOR-----------------------------------

export const deactivateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findOneAndUpdate(
      { _id: doctorId, role: "doctor" },
      { isActive: false, status: "inactive" },
      {returnDocument: 'after'}
    ).select("-password");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor deactivated successfully",
      doctor,
    });

  } catch (err) {
    console.error("DEACTIVATE DOCTOR ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate Doctor",
    });
  }
};
// -------------------REACTIVATE DOCTOR-------------------------------------
export const reactivateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findOneAndUpdate(
      { _id: doctorId, role: "doctor", isActive: false, status: "inactive" },
      { isActive: true, status: "available" },
      { returnDocument: 'after' } 
    ).select("-password");

    if (!doctor) return res.status(404).json({ success: false, message: "No doctor found" });

    res.status(200).json({
      success: true,
      message: "Reactivated Doctor Successfully",
      doctor
    });
  } catch (err) {
    console.error("REACTIVATE DOCTOR ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to reactivate Doctor",
    });
  }
};

// ----------------DELETE DOCTOR-------------------------------------------------

export const deleteDoctor = async(req, res) =>{
  try{
    const {doctorId} = req.params;
    const doctor = await User.findByIdAndDelete(doctorId);
    if(!doctor) return res.status(400).json({message: "Doctor not found"});

    res.status(200).json({
      success: true,
      message: "Doctor Deleted suuccessfully"
    })
  }catch(err){
    console.log("DELTE DOCTOR ERROR", err);
    res.status(500).json({
      success: false,
      message: "Doctor deleted "
    })
    
  }
}


// ----------------------------- ADMIN PATIENT REGISTRATION -----------------------------
export const patientRegistration = async (req, res) => {
   try {
    const { name, email, phone, dob, gender, bloodGroup } = req.body;

    if (!name || !phone || !gender || !dob) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, dob and gender are required",
      });
    }

    let user = null;



    if (email) {
      user = await User.findOne({ email });
    }

    const patient = await Patient.create({
      name,
      phone,
      email,
      dob: new Date(dob),
      gender,
      bloodGroup,
      userId: user?._id || null
    });

    res.status(201).json({
      success: true,
      message: "Patient added successfully",
      patient
    });

  } catch (err) {
    console.error("ADD NEW PATIENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add patient",
    });
  }
};
// ----------------------------- GET ALL PATIENTS -----------------------------
export const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" }).select("-password");

    res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (err) {
    console.error("FETCH PATIENTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
    });
  }
};

// -------------------------GET PATIENT BY ID------------------------------------

export const getPatientById = async (req, res) => {
    try{
        const {patientId} = req.params;
        const patient = await User.findOne({
            _id: patientId,
            role: "patient",
         })
            .select("-password")
        if (!patient)
            return res.status(404).json({success: false, message: "Patient Not Found"});
        res.status(200).json({
            success: true,
            patient
        })
            
    }catch(err){
        console.log("PATIENNT FETCH ERROR", err);
        res.status(500).json({
            success: false,
            message: "Failed to fecth patient buy id"

        })
        
    }
}

// --------------------------DEACTIVATE PATIENTS----------------------------
export const deactivatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findOneAndUpdate(
      { _id: patientId, role: "patient" },
      { isActive: false },
      { new: true }
    ).select("-password");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient deactivated successfully",
      patient,
    });

  } catch (err) {
    console.error("DEACTIVATE PATIENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate patient",
    });
  }
};


//--------------SEND NOTIFICATION TO PATIENT AND DOCTOR---------------------------

export const sendBroadcastNotification = async (req, res) => {
    try{
        const { message, receiverRole} = req.body;

        if(!message || !receiverRole) return res.status(400).josn({success: false, message: "fill all fields"});

        let userFilter = {};
        if( receiverRole !== "all"){
            userFilter.role = receiverRole
        };
        const users = await User.find(userFilter).select("+_id");

        const notifications = users.map(user => ({
            message,
            receiverRole,
            createdBy: req.user._id
        }))

        await Notification.insertMany(notifications);
        res.status(200).json({
        success: true,
        message: "Notification sent successfully"
        });
    }catch(err){
        console.log("BROADCAST ERROR", err);
        res.status(500).json({
        success: false,
        message: "Failed to send notification"
        });
    }
}

// -------------------- ASSIGN DOCTOR DEAPARTMET----------------------------

export const assignDoctorDepartment = async (req, res) =>{
  try{
    const doctorId = req.params;
    const departmentName = req.body;

    if(!departmentName) return res.status(400).json({success: false, message: "Enter Department"});

    const department = await Department.findOne(departmentName);
    const departmentId = department._id
    if (!departmentId) return res.status(400).json({success: false, message: "Departtment not found"});

    const doctor = await User.findById(doctorId)
    if(!doctor) return res.status(400).json({success: false, message: "No doctor found"});

    doctor.departmentId = departmentId;
    await doctor.save();
    const updatedDoctor = await User.findById(doctorId)
      .select("-password")
      .populate("departmentId","name");

    res.status(200).json({
      success: true,
      message:"Assigned doctor's department successfully",
      doctor: updateDoctor
    });

  }catch(err){
    console.error("ASSIGN DEPARTMENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to assign department",
    });
  }
}
// ---------------- APPROVE / REJECT LEAVE (ADMIN) ----------------

export const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body;

    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        status,
        approvedBy: req.user._id,
      },
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    
    if (status === "approved") {
      await User.findByIdAndUpdate(
        leave.doctorId,
        {status: "on-leave"},
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: `Leave ${status} successfully`,
      leave,
    });

  } catch (err) {
    console.error("LEAVE STATUS ERROR:", err);
    res.status(500).json({ success: false });
  }
};
// -------------------------ADMIN DASHBOARD-----------------------------------
export const adminDashboardStats = async (req, res) => {
  try {

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const totalAppointmentsToday = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const completedAppointments = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      status: "completed"
    });

    const remainingAppointments = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ["scheduled", "follow-up"] }
    });

    const cancelledAppointments = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      status: "cancelled"
    });

    const todayWalkins = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      $or: [
        { patientId: { $exists: false } },
        { patientId: null }
      ]
    });

    const todayNewPatients = await User.countDocuments({
      role: "patient",
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalAppointmentsToday,
        completedAppointments,
        remainingAppointments,
        cancelledAppointments,
        todayWalkins,
        todayNewPatients
      }
    });

  } catch (err) {
    console.log("ADMIN DASHBOARD ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard stats"
    });
  }
};



// --------------------queue-------------------------

export const getAdminQueues = async (req, res) => {
  try {
    // Today's range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get all doctors
    const doctors = await User.find({ role: "doctor", isActive: true })
      .select("_id name status")
      .lean();

    // Map doctors with queues
    const queues = await Promise.all(
      doctors.map(async (doctor) => {
        const appointments = await Appointment.find({
          doctorId: doctor._id,
          date: { $gte: todayStart, $lte: todayEnd },
          status: "scheduled",
          token: { $ne: null }
        })
          .sort({ token: 1 })
          .select("patient token queueStatus timeSlot");

        const inConsultation = appointments.find(a => a.queueStatus === "in_consultation") || null;
        const waiting = appointments.filter(a => a.queueStatus === "waiting");

        return {
          doctorId: doctor._id,
          name: doctor.name,
          status: doctor.status,
          inConsultation,
          waiting
        };
      })
    );

    res.status(200).json({
      success: true,
      queues
    });

  } catch (err) {
    console.error("ADMIN QUEUES ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin queues"
    });
  }
};

// -------------PATIENT MINIMAL DETAILS----------------------

export const getAllPatientsMinimal = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .select("patientId patient") 
      .populate("patientId", "name phone") 

    const patientsMap= {};

    appointments.forEach(app => {
      const patientData = app.patientId || app.patient;
      const key = app.patientId ? app.patientId._id.toString() : app.patient.phone;

      if (!patientsMap[key]) {
        patientsMap[key] = {
          _id: app.patientId?._id,
          name: patientData.name,
          phone: patientData.phone
        };
      }
    });

    res.status(200).json({
      success: true,
      count: Object.keys(patientsMap).length,
      data: Object.values(patientsMap)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch patients" });
  }
};
// --------------------DOCTOR QUEUE-------------------------
export const getDoctorQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) return res.status(400).json({ success: false, message: "Doctor ID required" });

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const now = new Date();

    const inConsultation = await Appointment.findOne({
      doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: "scheduled",
      queueStatus: "in_consultation",
      token: { $ne: null }
    }).select("patient.name patient.phone token queueStatus timeSlot tokenType tokenNumber");

    const waitingRaw = await Appointment.find({
      doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: "scheduled",
      queueStatus: "waiting",
      token: { $ne: null }
    }).select("patient.name patient.phone token queueStatus timeSlot tokenType tokenNumber date arrivalTime");

    const ready = [];
    const future = [];
    const walkin = [];

    waitingRaw.forEach(a => {
      if (a.tokenType === "booked" && a.timeSlot?.startTime) {
        const [h, m] = a.timeSlot.startTime.split(":").map(Number);
        const slotTime = new Date(a.date); slotTime.setHours(h, m, 0, 0);

        if (now >= slotTime) ready.push(a);
        else future.push(a);
      } else walkin.push(a);
    });

    ready.sort((a, b) => a.tokenNumber - b.tokenNumber);
    walkin.sort((a, b) => a.tokenNumber - b.tokenNumber);
    future.sort((a, b) => a.tokenNumber - b.tokenNumber);

    const waiting = [...ready, ...walkin, ...future];
    const nextPatient = waiting.length > 0 ? waiting[0] : null;

    return res.status(200).json({
      success: true,
      doctorId,
      inConsultation,
      nextPatient,
      waiting
    });

  } catch (err) {
    console.error("DOCTOR QUEUE ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch doctor queue" });
  }
};
// -----------------APPROVE LEAVE-----------------------------

export const approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Leave already processed",
      });
    }

    leave.status = "approved";
    leave.approvedBy = req.user._id; 

    const doctor = await User.findById(leave.doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const affectedAppointments = await Appointment.find({
      doctorId: leave.doctorId,
      date: { $gte: leave.fromDate, $lte: leave.toDate },
      status: "scheduled",
    }).populate("patientId", "userId");

      
    for (const appt of affectedAppointments) {
        try {
          
          await sendEmailAppointmentAffectedByDoctorLeave(
            appt.patient.email,
            appt.patient.name,
            doctor.name,
            appt.date
          );



          if (appt.patientId.userId) {
            await Notification.create({
              message: `Your appointment on ${new Date(appt.date).toDateString()} with Dr. ${doctor.name} is affected because the doctor is on leave. Please reschedule at the earliest.\n\nSorry for the incovenience`,
              receiver: appt.patientId.userId,
              receiverRole: "patient",
              appointmentId: appt._id,
              type: "appointment",
            });
          }

          console.log("Creating notification for:", appt._id);
          console.log("Receiver:", appt.patientId.userId);

          appt.status = "cancelled";
          await appt.save();

          console.log("Updated:", appt._id);

        } catch (err) {
          console.error("Error processing appointment:", appt._id, err);
        }
      }
    await leave.save();


    const from = new Date(leave.fromDate).toLocaleDateString(); 
    const to = new Date(leave.toDate).toLocaleDateString();    

    const text = `Your leave request from ${from} to ${to} is approved.
    
    Click here to see more`;


    await Notification.create({
      message: text,
      receiver: leave.doctorId,
      receiverRole: "doctor",
      leaveId: leave._id,
      type: "leave"
    })

    res.status(200).json({
      success: true,
      message: "Leave approved successfully",
      leave,
      affectedAppointments,
    });
  } catch (err) {
    console.error("APPROVE LEAVE ERROR:", err);
    res.status(500).json({ success: false });
  }
};

//---------------------REJECT LEAVE---------------------------------

export const rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { rejectionReason } = req.body;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Leave already processed",
      });
    }

    leave.status = "rejected";
    leave.rejectionReason = rejectionReason || "Not specified";
    leave.rejectedBy = req.user._id;
    leave.rejectedAt = new Date();

    await leave.save();

    const from = new Date(leave.fromDate).toLocaleDateString(); 
    const to = new Date(leave.toDate).toLocaleDateString();    

    const text = `Your leave request from ${from} to ${to} is rejected.
    
    Click here to see more`;

    res.status(200).json({
      success: true,
      message: "Leave rejected",
      leave,
    });
  } catch (err) {
    console.error("REJECT LEAVE ERROR:", err);
    res.status(500).json({ success: false });
  }
};



export const getAllLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query; 

    let filter = {};

    if (status) {
      filter.status = status;
    }

    const leaves = await Leave.find(filter)
      .populate("doctorId", "name email") 
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (err) {
    console.error("GET ALL LEAVES ERROR:", err);
    res.status(500).json({ success: false });
  }
};

// -----------------------------ATTENDANCE----------------------------------------------
export const getDoctorMonthlyAttendanceAdmin = async (req, res) => {
  try {
    const { doctorId } = req.params;
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
      appointments.map(a => a.date && new Date(a.date).toDateString()).filter(Boolean)
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

      days.push({ date: new Date(current), status });
      current.setDate(current.getDate() + 1);
    }

    res.status(200).json({ success: true, days });
  } catch (err) {
    console.log("ATTENDANCE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


export const getDoctorLeavesAdmin = async (req, res) => {
  try {
    const {doctorId} = req.params;

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


export const checkDoctorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ available: false });
    }

    const selected = new Date(date);

    const start = new Date(selected);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(selected);
    end.setUTCHours(23, 59, 59, 999);

        const leave = await Leave.findOne({
      doctorId: id,
      status: "approved",
      fromDate: { $lte: end },
      toDate: { $gte: start }
    });

    console.log("LEAVE", leave);
    

    return res.json({ available: !leave, leave });

  } catch (err) {
    console.error("AVAILABILITY ERROR:", err);
    res.status(500).json({ available: false });
  }
};

export const getPrescriptionByAppointmentId = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const prescription = await Prescription.findOne({ appointmentId })
      .populate("doctorId", "name qualification specialization")
      .populate("patientId", "name phone gender dob")
      .lean();

    res.status(200).json({ success: true, prescription: prescription || null });
  } catch (err) {
    console.error("GET PRESCRIPTION BY APPOINTMENT ID ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch prescription" });
  }
};


export const getNotificationsAdmin = async (req, res) => {
  
  try {
    const notifications = await Notification.find({
      receiver: req.user._id
    })
      .populate({
        path: "leaveId",
        select: "doctorId fromDate toDate"
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
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



export const markNotificationReadAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { receiver: req.user._id },
          { receiver: null, receiverRole: "admin" }
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



export const markAllNotificationsReadAdmin = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      {
        $or: [
          { receiver: userId },
          { receiver: null, receiverRole: "admin" }
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




