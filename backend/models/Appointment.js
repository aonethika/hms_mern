import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },

    patient: {
      name: String,
      email: String,
      phone: String,
      gender: String,
      dob: Date,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    token: {
      type: String,
    },

    tokenType: {
      type: String,
      enum: ["walk-in", "booked"],
    },

    tokenGeneratedAt: {
      type: Date,
    },

    source: {
      type: String,
      enum: ["walk-in", "online"],
      default: "walk-in",
    },

    timeSlot: {
      startTime: String,
      endTime: String,
    },

    arrivalTime: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no_show", "follow-up"],
      default: "scheduled",
    },

    queueStatus: {
      type: String,
      enum: ["waiting", "in_consultation", "done", "no_show"],
      default: "waiting",
    },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },

    followUpRequired: {
      type: Boolean,
      default: false,
    },

    followUpDate: {
      type: Date,
    },

    parentAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    notes: String,
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, date: 1 });

appointmentSchema.virtual("patientAge").get(function () {
  if (!this.patient?.dob) return null;

  const today = new Date();
  const birthDate = new Date(this.patient.dob);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
});

export default mongoose.model("Appointment", appointmentSchema);