import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true
    },

    receiverRole: {
      type: String,
      enum: ["patient", "doctor", "all", "admin"],
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },

    leaveId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave"
    },

    prescriptionId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription"
    },

    type: {
      type: String,
      enum: ["broadcast", "appointment", "leave", "prescription"],
      default: "broadcast"
    },

    isRead: {
      type: Boolean,
      default: false
    },

    scheduledFor: Date,


    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);