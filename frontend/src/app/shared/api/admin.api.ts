import { authRequest } from "./auth.api";

// ----------------- DASHBOARD -----------------
export const adminDashboardStatsApi = async () => {
    const res = await authRequest.get("/admin/dashboard");
    return res.data;
};

export const editAdminProfileApi = async (data: any) => {
    const res = await authRequest.put("/admin/update", data);
    return res.data;
};

// ----------------- DOCTORS -----------------
export const addDoctorAdminApi = async (data: any) => {
    const res = await authRequest.post("/admin/doctor", data);
    return res.data;
};

export const getAllDoctorsAdmin = async () => {
    const res = await authRequest.get("/admin/doctors");
    return res.data;
};

export const getAvailableDoctorsByDateAdmin = async (date: string) => {
    const res = await authRequest.get("/admin/doctors/available", { params: { date } });
    return res.data;
};

export const getDoctorByIdAdminApi = async (doctorId: string) => {
    const res = await authRequest.get(`/admin/doctor/${doctorId}`);
    return res.data;
};

export const updateDoctorDetailsAdminApi = async (doctorId: string, data: any) => {
    const res = await authRequest.put(`/admin/doctor/${doctorId}/update`, data);
    return res.data;
};

export const deleteDoctorAdminApi = async (doctorId: string) => {
    const res = await authRequest.delete(`/admin/doctor/${doctorId}/delete`);
    return res.data;
};

export const deactivateDoctorAdminApi = async (doctorId: string) => {
    const res = await authRequest.put(`/admin/doctor/${doctorId}/deactivate`);
    return res.data;
};

export const reactivateDoctorAdminApi = async (doctorId: string) => {
    const res = await authRequest.put(`/admin/doctor/${doctorId}/reactivate`);
    return res.data;
};

export const getDoctorMonthlyAttendanceApi = async (doctorId: string, month: number, year: number) => {
    const res = await authRequest.get(`/admin/attendance/${doctorId}`, { params: { month, year } });
    return res.data;
};

export const getDoctorTodayQueueApi = async (doctorId: string) => {
    const res = await authRequest.get(`/admin/doctor/${doctorId}/queue`);
    return res.data;
};

// ----------------- PATIENTS -----------------
export const addPatientAdminApi = async (data: any) => {
    const res = await authRequest.post("/admin/patient", data);
    return res.data;
};

export const getAllPatientsMinimal = async () => {
    const res = await authRequest.get("/admin/patients/minimal");
    return res.data;
};

export const getPatientsByPhone = async (phone: string) => {
    const res = await authRequest.get(`/admin/patients/phone/${phone}`);
    return res.data;
};

export const getAllPatients = async () => {
    const res = await authRequest.get("/admin/patients");
    return res.data;
};

export const getPatientHistory = async (patientId: string) => {
    const res = await authRequest.get(`/admin/patient-history/${patientId}`);
    return res.data;
};

// ----------------- LEAVES -----------------
export const getAllDoctorLeaves = async () => {
    const res = await authRequest.get("/admin/leave/all");
    return res.data;
};

export const approveLeaveApi = async (leaveId: string) => {
    const res = await authRequest.put(`/admin/leave/approve/${leaveId}`);
    return res.data;
};

export const rejectLeaveApi = async (leaveId: string, reason: string) => {
    const res = await authRequest.put(`/admin/leave/reject/${leaveId}`, { rejectionReason: reason });
    return res.data;
};

// ----------------- NOTIFICATIONS -----------------
export const getAdminNotificationsApi = async () => {
    const res = await authRequest.get("/admin/notifications");
    return res.data;
};

export const markNotificationReadAdmin = async (id: string) => {
    const res = await authRequest.put(`/admin/notifications/${id}/read`);
    return res.data;
};

export const markAllNotificationsReadAdmin = async () => {
    const res = await authRequest.put("/admin/notifications/all");
    return res.data;
};