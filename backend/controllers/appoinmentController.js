import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Department from "../models/Department.js";
import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Leave from "../models/Leave.js";
import { sendEmailAccountCreated } from "../utils/senEmail.js";
import argon2 from "argon2";
import crypto from "crypto";

// -----AGE CALCULATION---------------------------------------
const calculateAge = (dobStr) => {
  if (!dobStr) return null;
  const today = new Date();
  const birthDate = new Date(dobStr);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// -------------------- CREATE APPOINTMENT BY ADMIN----------------------------
export const createAppointmentByAdmin = async (req, res) => {
  try {
    const {
      patientType,
      patientId,
      name,
      phone,
      gender,
      dob,
      email,
      bloodGroup,
      source,
      doctorId,
      departmentId,
      timeSlot,
      notes,
      date
    } = req.body;

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot book appointment in the past"
      });
    }

    if (!doctorId || !departmentId || !source || !date) {
      return res.status(400).json({ success: false, message: "Fill required fields" });
    }

    if (patientType === "walk-in" && (!name || !phone || !dob || !gender)) {
      return res.status(400).json({ success: false, message: "Name, phone, dob and gender are required" });
    }

    if (patientType === "register" && (!name || !phone || !email || !dob || !gender)) {
      return res.status(400).json({ success: false, message: "Name, Phone, Email, Gender and DOB are required" });
    }

    if (patientType === "registered" && !patientId) {
      return res.status(400).json({ success: false, message: "PatientId required" });
    }

    const doctor = await User.findById(doctorId)
      .select("name phone specialization qualification consultationFee workingHours role");

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const department = await Department.findById(departmentId).select("name");

    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const leave = await Leave.findOne({
      doctorId,
      date: {
        $gte: selectedDate,
        $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (leave) {
      return res.status(400).json({
        success: false,
        message: "Doctor is on leave on selected date"
      });
    }

    if (timeSlot) {
      const existingSlotBookings = await Appointment.countDocuments({
        doctorId,
        date: selectedDate,
        "timeSlot.startTime": timeSlot.startTime,
        "timeSlot.endTime": timeSlot.endTime
      });

      const maxPerSlot = 5;

      if (existingSlotBookings >= maxPerSlot) {
        return res.status(400).json({
          success: false,
          message: "Selected time slot is full"
        });
      }
    }

    let patientRef = null;
    let patientObj = null;

    if (patientType === "walk-in") {
      const walkInPatient = await Patient.create({
        name,
        gender,
        phone,
        bloodGroup,
        dob,
        age: calculateAge(dob)
      });

      patientRef = walkInPatient._id;
      patientObj = { name, phone, gender, bloodGroup, dob, age: calculateAge(dob) };
    }

    else if (patientType === "register") {

      const password = crypto.randomBytes(8).toString("hex");
      const hashedPassword = await argon2.hash(password);

      const newUser = await User.create({
        name,
        phone,
        email,
        password: hashedPassword,
        gender,
        dob,
        bloodGroup,
        role: "patient",
        isActive: true
      });

      const newPatient = await Patient.create({
        userId: newUser._id,
        name,
        email,
        phone,
        gender,
        dob
      });

      await sendEmailAccountCreated(newUser.email,newUser.name, password);

      patientRef = newPatient._id;
      patientObj = { name, phone, email, gender, dob, bloodGroup };
    }

    else if (patientType === "registered") {
      const existingPatient = await Patient.findById(patientId);

      if (!existingPatient) {
        return res.status(404).json({ success: false, message: "Registered patient not found" });
      }

      patientRef = existingPatient._id;

      patientObj = {
        name: existingPatient.name,
        email: existingPatient.email,
        phone: existingPatient.phone,
        gender: existingPatient.gender,
        dob: existingPatient.dob
      };
    }

    const appointment = await Appointment.create({
      patientId: patientRef,
      patient: patientObj,
      doctorId,
      departmentId,
      date: selectedDate,
      timeSlot: timeSlot || null,
      source: "walk-in",
      notes
    });

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment
    });

  } catch (err) {
  console.error("❌ ERROR MESSAGE:", err?.message);
  console.error("❌ FULL ERROR:", err);
  console.error("❌ STACK TRACE:", err?.stack);

  return res.status(500).json({
    success: false,
    message: err?.message || "Failed to create appointment",
  });
}
};

// ----------------------------TOKEN---------------------------------------------------
export const generateToken = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID required"
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (appointment.token) {
      return res.status(400).json({
        success: false,
        message: "Token already generated"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate.getTime() !== today.getTime()) {
      return res.status(400).json({
        success: false,
        message: "Token can only be generated on appointment day"
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAppointments = await Appointment.find({
      doctorId: appointment.doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      token: { $ne: null }
    });

    let walkinCount = 0;
    let bookedCount = 0;

    todayAppointments.forEach(a => {
      if (a.tokenType === "walk-in") walkinCount++;
      if (a.tokenType === "booked") bookedCount++;
    });

    let tokenType = "walk-in";

if (appointment.timeSlot?.startTime && appointment.timeSlot?.endTime) {
  const now = new Date();
  const [startHour, startMin] = appointment.timeSlot.startTime.split(":").map(Number);
  const [endHour, endMin] = appointment.timeSlot.endTime.split(":").map(Number);

  const slotStart = new Date(appointment.date);
  slotStart.setHours(startHour, startMin, 0, 0);

  const slotEnd = new Date(appointment.date);
  slotEnd.setHours(endHour, endMin, 0, 0);

  if (now <= slotEnd) {
    tokenType = "booked";
  }
}

    let token;
    let tokenNumber;

    if (tokenType === "walk-in") {
      walkinCount++;
      tokenNumber = walkinCount;
      token = `W${walkinCount.toString().padStart(2, "0")}`;
    } else {
      bookedCount++;
      tokenNumber = bookedCount;
      token = `B${bookedCount.toString().padStart(2, "0")}`;
    }

    appointment.token = token;
    appointment.tokenNumber = tokenNumber;
    appointment.tokenType = tokenType;
    appointment.tokenGeneratedAt = new Date();
    appointment.arrivalTime = new Date();

    const currentPatient = await Appointment.findOne({
      doctorId: appointment.doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      queueStatus: "in_consultation"
    });

    if (!currentPatient) {
      appointment.queueStatus = "in_consultation";
    } else {
      appointment.queueStatus = "waiting";
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Token generated",
      token
    });

  } catch (err) {
    console.error("TOKEN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to generate token"
    });
  }
};

// -----------skip- patient-------------------------------
export const skipPatient = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        status: "scheduled"
      },
      {
        status: "no-show",
        queueStatus: "no_show"
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or already processed"
      });
    }

    await Appointment.updateMany(
      {
        doctorId: appointment.doctorId,
        date: { $gte: start, $lte: end },
        queueStatus: "in_consultation"
      },
      {
        queueStatus: "waiting"
      }
    );

    const nextPatient = await Appointment.findOne({
      doctorId: appointment.doctorId,
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
      message: "Patient skipped",
      skipped: appointment,
      nextPatient
    });

  } catch (err) {
    console.error("SKIP ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to skip patient"
    });
  }
};

//-------------------------CANCEL APPOINMENT--------------------------------------

export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "cancelled" },
      { new: true }
    );

    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment
    });
  } catch (err) {
    console.error("CANCEL APPOINTMENT ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to cancel appointment" });
  }
};
//----------------APPOINMNET COMPLETE---------------------------------------

export const completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    appointment.status = "completed";
    appointment.queueStatus = "done";

    await appointment.save();

    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    const nextPatient = await Appointment.findOne({
      doctorId: appointment.doctorId,
      date: { $gte: start, $lte: end },
      status: "scheduled",
      queueStatus: "waiting",
      token: { $ne: null }
    }).sort({ token: 1 });

    if (nextPatient) {
      nextPatient.queueStatus = "in_consultation";
      await nextPatient.save();
    }

    res.status(200).json({
      success: true,
      message: "Appointment marked as completed",
      appointment,
      nextPatient
    });

  } catch (err) {
    console.error("COMPLETE APPOINTMENT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to complete appointment"
    });
  }
};

//-----------------------GET ALL APPOINMENTS FOR ADMIN------------------------

export const fecthAllAppointments = async (req,res) => {
    try{
      
    const appointments = await Appointment.find()
      .populate("patientId")    
      .populate("doctorId")     
      .populate("departmentId"); 
   
        if(!appointments.length) return res.status(400).json({success: false, message: "No appointments found"});

        res.status(200).json({
            success: true,
            message: "Successfully fetched all appointements",
            appointments
        })
    }catch(err){
        console.log("FETCHING APPOINTMENTS ERROR", err);
        res.status(500).json({
            success: false,
            message: err
        })
        
    }
}
// -----------------------------GET DOCTOR APPOINMENTS------------------------

export const getDoctorAppointments = async ( req, res ) =>{
  try{
    const {doctorId} = req.body;
    if(!doctorId) return res.status(400).json({success: false, message: "Doctor id is required"})
    
    const appointments = await Appointment.find({doctorId})
      .populate("patientId", "name phone gender")
      .populate("departmentId", "name")
      .sort({date: 1});

    if(!appointments) return res.status(400).json({message: "No appointments found"})

      res.status(200).json({
        success: true,
        count: appointments.length,
        appointments
      })

  }catch(err){
    console.log("GET DOCTOR APPOINTMENTS ERROR",err);
    res.status(500).json({success: false, message: "Failed to fetch doctor's appointments"});
  }
}

// -----------------------GET APPLICATION BY ID----------------------------

export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorId", "name")
      .populate("departmentId", "name")
      .populate("patientId", "name phone");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json(appointment);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointment by id" });
  }
};
// -------------------GET PATIENT HISTORY-----------------------------------
export const getPatientWithAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Patient identifier required" });

    const patientQuery = [{ "patient.phone": id }];
    if (mongoose.Types.ObjectId.isValid(id)) patientQuery.push({ patientId: id });

    let appointments = await Appointment.find({ $or: patientQuery })
      .populate({
        path: "patientId",
        select: "name phone gender dob",
        options: { lean: true }
      })
      .populate("doctorId", "name")
      .populate("departmentId", "name")
      .populate("prescriptionId", "_id")
      
      .sort({ date: -1 })
      .lean({ virtuals: true }); 

    if (!appointments.length) {
      return res.status(404).json({ success: false, message: "Patient not found or no appointments" });
    }

    // unify patient object
    const firstAppointment = appointments[0];
    let patient = firstAppointment.patientId || firstAppointment.patient;

    // calculate age if missing
    if (!patient.age && patient.dob) {
      const today = new Date();
      const birthDate = new Date(patient.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      patient.age = age;
    }

    // fallback for walk-ins with no dob
    if (!patient.age) patient.age = null;

    // attach this patient to every appointment for frontend convenience
    const appointmentsWithPatient = appointments.map(app => ({
      ...app,
      patient
    }));

    res.status(200).json({
      success: true,
      patient,
      appointments: appointmentsWithPatient
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch patient history" });
  }
};


export const getPatientsByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number required"
      });
    }

    const patients = await Patient.find({
      phone: phone,
    }).select("name phone dob gender email");

    res.status(200).json({
      success: true,
      data: patients
    });

  } catch (error) {
    console.error("GET PATIENT BY PHONE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ---------------------ADD NEW PATIENT WITH SAME NUMBER----------------------------

export const addNewPatient = async (req, res)=>{
  try{
    const { name, phone, email, gender, dob, bloodGroup } = req.body;

  }catch(err){

  }
}


// --------------MARK NO SHOW----------------------------------------

export const markNoShowInternal = async () => {
  try {
    const now = new Date();

    const result = await Appointment.updateMany(
      {
        status: "scheduled",
        date: { $lt: now }
      },
      {
        status: "no-show"
      }
    );

    console.log(`[CRON] No-show updated: ${result.modifiedCount}`);
  } catch (err) {
    console.error("[CRON ERROR]:", err);
  }
};

export const getRemainingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "scheduled" })
      .populate({ path: "doctorId", select: "name" })
      .populate({ path: "departmentId", select: "name" })
      .populate({ path: "patientId", select: "name phone" })
      .sort({ date: 1 })
      .lean();

    res.status(200).json({ success: true, appointments });
  }catch (err) {
  console.error("GET REMAINING APPOINTMENTS ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Failed to fetch remaining appointments",
    error: err.message
  });
}
};

export const getCompletedAppointments = async(req,res)=>{
  try{

    const appointments = await Appointment.find({
      status: "completed"
    })
     .populate("doctorId", "name")       
      .populate("departmentId", "name")  
      .populate("patientId", "name phone") 
      .sort({ date: 1 })                  
      .lean();
    res.status(200).json({
      success: true,
      appointments
    });
  } catch (err) {
    console.error("GET REMAINING APPOINTMENTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch remaining appointments"
    });
  }
};