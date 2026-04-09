import { AdminAppointment, AdminAppointmentResponse } from "../types/appointment.admin";
import { authRequest } from "./auth.api";

// ----------------- CREATE APPOINTMENT -----------------
export interface AdminBookingAppointemntData {
  patientType: "register" | "registered" | "walk-in";
  patientId?: string;
  name: string;
  gender: "female" | "male" | "other";
  dob: string;
  age?: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  doctorId: string;
  departmentId: string;
  source: "online" | "walk-in";
  notes?: string;
  date: string;
}

/**
 * Create a new appointment by admin
 */
export const createAppointmentByAdminApi = async (
  data: AdminBookingAppointemntData
): Promise<AdminAppointmentResponse> => {
  const res = await authRequest.post("/appointments", data);
  return res.data;
};

// ----------------- GENERATE TOKEN -----------------
/**
 * Generate token for an appointment
 */
export const generateTokenApi = async (appointmentId: string) => {
  const res = await authRequest.get(`/appointments/${appointmentId}/token`);
  return res.data;
};

// ----------------- FETCH APPOINTMENTS -----------------
/**
 * Get all appointments for a doctor on a given date
 */
export const getAllAppointmentsApi = async (doctorId: string, date: string) => {
  const res = await authRequest.get("/appointments/doctor", {
    params: { doctorId, date },
  });
  return res.data;
};

/**
 * Get remaining appointments (today/pending)
 */
export const getRemainingAppointmentsAdmin = async () => {
  const res = await authRequest.get("/appointments/remaining");
  return res.data;
};

/**
 * Get completed appointments
 */
export const getCompletedAppointmentsAdmin = async () => {
  const res = await authRequest.get("/appointments/completed");
  return res.data;
};

/**
 * Get online bookings for a date (optional doctor filter)
 */
export const getOnlineBookingsApi = async (date: string, doctorId?: string) => {
  const res = await authRequest.get("/appointments/online", {
    params: { date, doctorId },
  });
  return res.data;
};