import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: { type: String, sparse: true, unique: true, lowercase: true },

    password: { type: String },

    phone: { type: String, required: true },

    role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },

    dob: { type: Date },

    gender: { type: String, enum: ["male", "female", "other"] },

    patientId: { type: String, unique: true, sparse: true },

    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },

    place: { type: String, trim: true },

    specialization: { type: String, required: function () { return this.role === "doctor"; } },

    qualification: { type: [String] },

    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },

    consultationFee: { type: Number },

    isActive: { type: Boolean, default: true },

    status: { type: String, enum: ["available", "busy", "on_leave", "inactive"], default: "available", required: function () { return this.role === "doctor"; } },

    // Doctor working hours
    workingHours: {
      startTime: { type: String, required: function () { return this.role === "doctor"; }, default: "10:00" },
      endTime: { type: String, required: function () { return this.role === "doctor"; }, default: "17:00" }
    },
    slotDuration: { type: Number, default: 30 }
  },
  { timestamps: true }
);

userSchema.virtual("age").get(function () {
  if (!this.dob) return null;
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export default mongoose.model("User", userSchema);