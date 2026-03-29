import User from "../models/User.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";
import {sendEmailForgotPassword } from "../utils/senEmail.js";

// -------------------------REGISTRATION---------------------------------------------
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      dob,
      gender,
      specialization,
      qualification,
      departmentId,
      consultationFee
    } = req.body;

    if (!name || !email || !password || !phone)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const existingUser = await User.findOne({email});
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });

    if (role && !["admin", "doctor", "patient"].includes(role))
      return res.status(400).json({ success: false, message: "Invalid role" });

    const hashedPassword = await argon2.hash(password);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      gender,
      dob: dob ? new Date(dob) : undefined,
      role: role || "patient",
      specialization,
      qualification,
      departmentId,
      consultationFee
    });

    let patient = null;
    if (user.role === "patient") {
      patient = await Patient.create({
        userId: user._id,
        name: user.name,
        dob: user.dob,
        gender: user.gender,
        phone: user.phone,
        email: user.email
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: "Registration successful", token, user: userResponse, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------LOGIN-----------------------------

export const userLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isValid = await argon2.verify(user.password, password);
    if (!isValid || user.role !== role) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, message: "Login successful", user: userResponse, token });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// ----------------------------------CHANGE PASSWORD-------------------------------------

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: "All fields are required" });

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const isOldPasswordValid = await argon2.verify(user.password, oldPassword);
    if (!isOldPasswordValid) return res.status(400).json({ success: false, message: "Incorrect password" });

    user.password = await argon2.hash(newPassword);
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Changing password failed" });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const tempPassword = Math.random().toString(36).slice(-8);
    user.password = await argon2.hash(tempPassword);
    await user.save();

    await sendEmailForgotPassword(user.email, user.name, tempPassword);

    res.status(200).json({ success: true, message: "Temporary password sent to your email" });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};