import { authRequest } from "./auth.api";


export const editPharmacistProfileApi = async (data: any) => {
    const res = await authRequest.put("/pharmacy/update", data);
    return res.data;
};


export const getPendingPrescriptionsApi = async () => {
  const res = await authRequest.get("/pharmacy/prescriptions/pending");
  return res.data;
};

export const getPrescriptionMedicinesApi = async (id: string) => {
  const res = await authRequest.get(
    `/pharmacy/prescription/${id}/medicines`
  );
  return res.data;
};

export const dispenseMedicineApi = async (
  prescriptionId: string,
  medicineId: string,
  quantity: number
) => {
  const res = await authRequest.post("/pharmacy/dispense", {
    prescriptionId,
    medicineId,
    quantity,
  });

  return res.data;
};


export const generateBillApi = async (prescriptionId: string) => {
  const res = await authRequest.post(
    `/pharmacy/bill/${prescriptionId}`
  );
  return res.data;
};

export const getBillStatusApi = async (prescriptionId: string) => {
  const res = await authRequest.get(
    `/pharmacy/bill/${prescriptionId}`
  );
  return res.data;
};

export const payBillApi = async (
  prescriptionId: string,
  amount: number
) => {
  const res = await authRequest.patch(
    `/pharmacy/bill/payment/${prescriptionId}`,
    { amount }
  );
  return res.data;
};

export const getAllBillsApi = async () => {
  const res = await authRequest.get("/pharmacy/bills");
  return res.data;
};

export const getBillApi = async (prescriptionId: string) => {
  const res = await authRequest.get(
    `/pharmacy/bill/view/${prescriptionId}`
  );
  return res.data;
};


export const getAllMedicines = async () => {
  const res = await authRequest.get(
    "/pharmacy/medicines"
  );
  return res.data;
};

export const createMdicines = async(data: any)=>{
  const res = await authRequest.post("/pharmacy/medicines", data);
  return res.data
}

export const addStockApi = async (medicineId: string, quantity: number) => {
  const res = await authRequest.patch(
    `/pharmacy/medicines/${medicineId}/stock`,
    { quantity }
  );
  return res.data;
};




// ----------------- NOTIFICATIONS -----------------
/** Get all notifications  */
export const getNotificationsPharmacistApi = async () => {
  const res = await authRequest.get("/pharmacy/notifications");
  return res.data;
};

/** Mark a notification as read */
export const markNotificationReadPharmacist = async (id: string) => {
  const res = await authRequest.put(`/pharmacy/notifications/${id}/read`);
  return res.data;
};

/** Mark all notifications as read */
export const markAllNotificationsReadPharmacist = async () => {
  const res = await authRequest.put("/pharmacy/notifications/all");
  return res.data;
};
