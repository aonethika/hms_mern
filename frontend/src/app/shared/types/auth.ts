export interface Patient {
  _id: string;
  name: string;
  gender: "male" | "female" | "other";
  dob: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "patient" | "doctor";

  patients?: Patient[];
}

export interface LoginResponse {
  user: User;
  token: string;
  success?: boolean
}