import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
     default: null
    },
    name: { type: String, required: true },
    dob: Date,
    gender: { type: String, enum: ["male","female","other"] },
    phone: String,
    email: String,
    bloodGroup: {type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],}
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);