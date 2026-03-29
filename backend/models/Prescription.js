import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },

    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    advice: {
      type: String,
      trim: true,
    },

    medicines: {
      type: [
        {
          name: { type: String, required: true },
          dosage: String,
          frequency: String,
          duration: String,
          instructions: String,
        },
      ],
      validate: [(val) => val.length > 0, "At least one medicine is required"],
    },

    followUp: {
      type: Boolean,
      default: false,
    },

    followUpDate: {
      type: Date,
      required: function () {
        return this.followUp === true;
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ createdAt: -1 });

export default mongoose.model("Prescription", prescriptionSchema);