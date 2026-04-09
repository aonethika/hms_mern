import { create } from "zustand";
import { getAllPatientsMinimal } from "../api/admin.api";

interface PatientMinimal {
  id: string;
  name: string;
  phone: string;
}

interface PatientMinimalStore {
  patients: PatientMinimal[];
  loading: boolean;
  error: string | null;
  fetchPatientsMinimal: () => Promise<void>;
}

const usePatientStore = create<PatientMinimalStore>((set) => ({
  patients: [],
  loading: false,
  error: null,

  fetchPatientsMinimal: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getAllPatientsMinimal();
      set({
        patients: res.patients || [],
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || "Failed to fetch patients",
        loading: false,
      });
    }
  },
}));

export default usePatientStore;