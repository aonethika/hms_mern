import { authRequest } from "./auth.api";

// ----------------- PATIENT PROFILE -----------------
/** Get all patients assigned to the logged-in patient account */
export const getMyPatientsApi = async () => {
  const res = await authRequest.get("/patient/my-patients");
  return res.data;
};

/** Create a new patient */
export const createPatient = async (patientData: any) => {
  const res = await authRequest.post("/patient/new-patient", patientData);
  return res.data;
};

/** Delete a patient by ID */
export const deletePatient = async (patientId: string) => {
  const res = await authRequest.delete(`/patient/patients/${patientId}`);
  return res.data;
};

// ----------------- NOTIFICATIONS -----------------
/** Get patient notifications */
export const getNotificationsPatientApi = async () => {
  const res = await authRequest.get("/patient/notifications");
  return res.data;
};

/** Mark a single notification as read */
export const markNotificationReadPatient = async (id: string) => {
  const res = await authRequest.put(`/patient/notifications/${id}/read`);
  return res.data;
};

/** Mark all notifications as read */
export const markAllNotificationsReadPatient = async () => {
  const res = await authRequest.put("/patient/notifications/all");
  return res.data;
};

// ----------------- DASHBOARD -----------------
/** Get patient dashboard stats */
export const getPatientDashboardStatsApi = async (patientId: string) => {
  const res = await authRequest.get("/patient/dashboard", { params: { patientId } });
  return res.data;
};

// ----------------- DOCTORS -----------------
/** Get available doctors for a specific date */
export const getAvailableDoctorsByDatePatient = async (date: string) => {
  const res = await authRequest.get("/admin/doctors/available", { params: { date } });
  return res.data;
};

/** Get available slots for a doctor on a specific date */
export const getDoctorSlots = async (doctorId: string, date: string) => {
  const res = await authRequest.get(`/patient/slots/${doctorId}/${date}`);
  return res.data;
};

// ----------------- APPOINTMENTS -----------------
/** Create a new appointment */
export const createAppointmentPatientApi = async (data: any) => {
  const res = await authRequest.post("/patient/appointment", data);
  return res.data;
};

/** Get upcoming appointments for a patient */
export const getUpcomingAppointments = async (patientId: string) => {
  const res = await authRequest.get("/patient/upcoming", { params: { patientId } });
  return res.data;
};

/** Get patient’s prescription history */
export const getPrescriptionHistory = async (patientId?: string) => {
  const res = await authRequest.get("/patient/prescriptions", {
    params: patientId ? { patientId } : {},
  });
  return res.data;
};

/** Get prescription by ID */
export const getPrescriptionByIdPatient = async (prescriptionId: string) => {
  const res = await authRequest.get(`/patient/prescriptions/${prescriptionId}`);
  return res.data;
};

/** Get follow-ups for a patient */
export const getMyFollowups = async (patientId?: string) => {
  const res = await authRequest.get("/patient/follow-ups", {
    params: patientId ? { patientId } : {},
  });
  return res.data;
};

/** Get all appointments of a patient */
export const getMyAppointments = async (patientId?: string) => {
  const res = await authRequest.get("/patient/my-appointments", {
    params: patientId ? { patientId } : {},
  });
  return res.data;
};

/** Cancel an appointment */
export const cancelAppointment = async (appointmentId: string) => {
  const res = await authRequest.put(`/patient/appointments/${appointmentId}/cancel`);
  return res.data;
};

/** Reschedule an appointment */
export const rescheduleAppointment = async (appointmentId: string, data: any) => {
  const res = await authRequest.put(`/patient/appointments/${appointmentId}/reschedule`, data);
  return res.data;
};