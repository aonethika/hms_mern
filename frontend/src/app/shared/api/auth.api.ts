import axios from "axios";
import { LoginResponse } from "../types/auth";

// ----------------- BASE URL -----------------
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
}

// ----------------- PUBLIC REQUEST -----------------
export const publicRequest = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ----------------- AUTH REQUEST -----------------
export const authRequest = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to all auth requests
authRequest.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------- LOGIN -----------------
export const userLogin = async (
  data: { email: string; password: string; role?: string }
): Promise<LoginResponse> => {
  const res = await publicRequest.post("/login", data);
  return res.data;
};

// ----------------- CHANGE PASSWORD -----------------
export const changePasswordApi = async (
  data: { oldPassword: string; newPassword: string }
): Promise<{ success: boolean; message: string }> => {
  const res = await authRequest.put("/change-password", data);
  return res.data;
};

// ----------------- REGISTER -----------------
export const patientSelfRegistration = async (
  data: { name: string; email: string; phone: string; password: string }
): Promise<LoginResponse> => {
  const res = await publicRequest.post("/register", data);
  return res.data;
};

// ----------------- FORGOT PASSWORD -----------------
export const forgotPassword = async (email: string) => {
  const res = await authRequest.post("/forgot-password", { email });
  return res.data;
};