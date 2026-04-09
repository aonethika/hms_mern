import { getAllDoctorsAdmin } from "../api/admin.api";
import { updateDoctorDetailsAdminApi } from "../api/admin.api"; 
import { create } from "zustand";
import { Doctor } from "../types/doctor";

interface DoctorStore {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  fetchDoctors: () => Promise<void>;
  editDoctor: (doctorId: string, data: Partial<Doctor>) => Promise<void>;
}

const useDoctorStore = create<DoctorStore>((set, get) => ({
  doctors: [],
  loading: false,
  error: null,

  fetchDoctors: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getAllDoctorsAdmin();
      set({ doctors: res.doctors || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch doctors", loading: false });
    }
  },

  editDoctor: async (doctorId: string, data: Partial<Doctor>) => {
    set({ loading: true, error: null });
    try {
      const updatedDoctor = await updateDoctorDetailsAdminApi(doctorId, data);
      
      
      const updatedDoctors = get().doctors.map((doc) =>
        doc.id === doctorId ? { ...doc, ...updatedDoctor } : doc
      );

      set({ doctors: updatedDoctors, loading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to update doctor", loading: false });
    }
  },
}));

export default useDoctorStore;