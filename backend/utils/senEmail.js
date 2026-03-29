import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

export const sendEmailAccountCreated = async (to, name, password) => {

  console.log("🔥 EMAIL FUNCTION CALLED", { to, name });
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS not set in .env");

  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,        
    port: Number(process.env.EMAIL_PORT), 
    secure: true,                        
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log("📨 Sending mail...");

  await transporter.sendMail({
    from: `"Hospital HMS" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your HMS Account Created",
    html: `
      <h3>Hello ${name}</h3>
      <p>Your account has been created.</p>
      <p><b>Email:</b> ${to}</p>
      <p><b>Temporary Password:</b> ${password}</p>
      <p>Please change your password after login.</p>
      <p>Thank You for visiting</p>
    `,
  });

  console.log("✅ Mail sent");
};


export const sendEmailForgotPassword = async (to, name, password) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS not set in .env");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,        
    port: Number(process.env.EMAIL_PORT), 
    secure: true,                        
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Nalanda Hospital" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Temperory Password",
    html: `
      <h3>Hello ${name}</h3>
      <p><b>Temporary Password:</b> ${password}</p>
      <p>Please change your password after login.</p>
    `,
  });

  console.log("Email sent successfully to", to);
};

export const sendEmailAppointmentAffectedByDoctorLeave = async (to, patientName, doctorName, appointmentDate) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_HOST || !process.env.EMAIL_PORT) {
    throw new Error("EMAIL_USER, EMAIL_PASS, EMAIL_HOST, or EMAIL_PORT not set in .env");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,        
    port: Number(process.env.EMAIL_PORT), 
    secure: true,                        
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const formattedDate = appointmentDate.toDateString(); 

  await transporter.sendMail({
    from: `"Nalanda Hospital" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Appointment Affected by Doctor Leave",
    html: `
      <h3>Hello ${patientName},</h3>
      <p>Your appointment on <b>${formattedDate}</b> with Dr. ${doctorName} is affected because the doctor is on leave.</p>
      <p>Please reschedule your appointment at your earliest convenience.</p>
      <p>Sorry for the inconvenience,<br/>Nalanda Hospital</p>
    `,
  });

  console.log("Email sent successfully to", to);
};