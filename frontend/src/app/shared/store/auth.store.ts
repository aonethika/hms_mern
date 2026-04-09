import { create } from "zustand";
import { LoginResponse, User } from "../types/auth";

interface Patient {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  bloodGroup?: string;
  dob?: string;
  gender: "male" | "female" | "other";
  userId: {
    email: string;
    phone: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  patients: Patient[];
  selectedPatient: Patient | null;
  isHydrated: boolean;

  login: (data: LoginResponse) => void;
  logout: () => void;
  setPatients: (patients: Patient[]) => void;
  setSelectedPatient: (patient: Patient) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  patients: [],
  selectedPatient: null,
  isHydrated: false,

  login: (data: LoginResponse) => {
    set({
      user: data.user,
      token: data.token,
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  },

  setPatients: (patients) => {
    const savedPatient = localStorage.getItem("selectedPatient");
    let selectedPatient = null;

    if (savedPatient) {
      const parsed = JSON.parse(savedPatient);
      selectedPatient =
        patients.find((p) => p._id === parsed._id) || patients[0] || null;
    } else {
      selectedPatient = patients[0] || null;
    }

    set({ patients, selectedPatient });

    if (selectedPatient) {
      localStorage.setItem(
        "selectedPatient",
        JSON.stringify(selectedPatient)
      );
    }

    localStorage.setItem("patients", JSON.stringify(patients));
  },

  setSelectedPatient: (patient) => {
    set({ selectedPatient: patient });
    localStorage.setItem("selectedPatient", JSON.stringify(patient));
  },

  logout: () => {
    set({
      user: null,
      token: null,
      patients: [],
      selectedPatient: null,
    });

    localStorage.clear();
  },
}));

if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  const selectedPatient = localStorage.getItem("selectedPatient");
  const patients = localStorage.getItem("patients");

  useAuthStore.setState({
    token,
    user: user ? JSON.parse(user) : null,
    selectedPatient: selectedPatient
      ? JSON.parse(selectedPatient)
      : null,
    patients: patients ? JSON.parse(patients) : [],
    isHydrated: true,
  });
}

export default useAuthStore;