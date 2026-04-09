import { create } from "zustand";
import { getAllDepartmentApi } from "@/app/shared/api/department.api";

interface Department {
  _id: string;
  name: string;
}

interface DepartmentStore {
  departments: Department[];
  loading: boolean;
  error: string | null;
  fetchDepartments: () => Promise<void>;
}

const useDepartmentStore = create<DepartmentStore>((set) => ({
  departments: [],
  loading: false,
  error: null,

  fetchDepartments: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getAllDepartmentApi();
      set({ departments: res.departments || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch departments", loading: false });
    }
  },
}));

export default useDepartmentStore;