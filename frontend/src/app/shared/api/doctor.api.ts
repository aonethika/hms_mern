import { authRequest } from "./auth.api";

// ----------------- PROFILE -----------------
/** Get logged-in doctor's profile */
export const getMyProfileApi = async () => {
  const res = await authRequest.get("/doctor/me");
  return res.data;
};

/** Update doctor's profile */
export const updateProfile = async (data: any) => {
  const res = await authRequest.put("/doctor/update-profile", data);
  return res.data;
};

// ----------------- NOTIFICATIONS -----------------
/** Get all notifications for doctor */
export const getNotificationsDoctorApi = async () => {
  const res = await authRequest.get("/doctor/notifications");
  return res.data;
};

/** Mark a notification as read */
export const markNotificationReadDoctor = async (id: string) => {
  const res = await authRequest.put(`/doctor/notifications/${id}/read`);
  return res.data;
};

/** Mark all notifications as read */
export const markAllNotificationsReadDoctor = async () => {
  const res = await authRequest.put("/doctor/notifications/all");
  return res.data;
};

// ----------------- DASHBOARD -----------------
/** Get dashboard stats */
export const getDoctorDashboardStats = async () => {
  const res = await authRequest.get("/doctor/dashboard");
  return res.data;
};

/** Get today's queue for doctor */
export const getDoctorTodayQueue = async () => {
  const res = await authRequest.get("/doctor/queue/today");
  return res.data;
};

/** Skip current patient in queue */
export const skipCurrentPatientByDoctorApi = async () => {
  const res = await authRequest.patch("/doctor/skip-current");
  return res.data;
};

// ----------------- PATIENTS -----------------
/** Get all patients assigned to doctor */
export const getMyPatients = async () => {
  const res = await authRequest.get("/doctor/my-patients");
  return res.data;
};

/** Get patient history by patient ID */
export const getMyPatientHistory = async (patientId: string) => {
  const res = await authRequest.get(`/doctor/history/${patientId}`);
  return res.data;
};

/** Create prescription for an appointment */
export const createPrescriptionApi = async (appointmentId: string, data: any) => {
  const res = await authRequest.post(`/doctor/appointment/${appointmentId}/prescription`, data);
  return res.data;
};

/** Get patient info by appointment ID */
export const getPatientByAppointmentId = async (appointmentId: string) => {
  const res = await authRequest.get(`/doctor/patient/${appointmentId}`);
  return res.data;
};

// ----------------- APPOINTMENTS -----------------
/** Get appointments (optionally filter by date or status) */
export const getAppointments = async (date?: string, status?: string) => {
  let query = "";
  if (date || status) {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (status) params.append("status", status);
    query = `?${params.toString()}`;
  }

  const res = await authRequest.get(`/doctor/appointments/today${query}`);
  return res.data;
};

/** Get prescription by ID */
export const getPrescriptionById = async (prescriptionId: string) => {
  const res = await authRequest.get(`/doctor/prescription/${prescriptionId}`);
  return res.data;
};

// ----------------- ATTENDANCE -----------------
/** Get doctor's monthly attendance */
export const getDoctorMonthlyAttendance = async (month: number, year: number) => {
  if (!month || !year) throw new Error("Month and year required");
  const res = await authRequest.get("/doctor/attendance", { params: { month, year } });
  return res.data;
};

// ----------------- LEAVES -----------------
/** Request leave */
export const requestLeave = async (data: { fromDate: string; toDate: string; reason?: string }) => {
  const res = await authRequest.post("/doctor/leave-request", data);
  return res.data;
};

/** Cancel a leave request */
export const cancelLeave = async (leaveId: string) => {
  const res = await authRequest.put(`/doctor/leave/cancel/${leaveId}`);
  return res.data;
};

/** Get all leaves of the doctor */
export const getMyLeaves = async () => {
  const res = await authRequest.get("/doctor/leave/my");
  return res.data;
};