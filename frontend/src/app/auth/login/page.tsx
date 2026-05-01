"use client";

import useAuthStore from "@/app/shared/store/auth.store";
import { LoginResponse } from "@/app/shared/types/auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { userLogin } from "@/app/shared/api/auth.api";

type Role = "patient" | "doctor" | "admin" | "pharmacist";

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [role, setRole] = useState<Role>("patient");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res: LoginResponse = await userLogin({
        ...formData,
        role,
      });

      login(res);
      localStorage.setItem("token", res.token);

      if (res.user.role === "admin") router.push("/admin/dashboard");
      else if (res.user.role === "doctor") router.push("/doctor/dashboard");
      else if (res.user.role === "pharmacist") router.push("/pharmacy/dashboard");
      else router.push("/patient/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login Failed");
    }
  };

  const demoAccounts: Record<Role, { email: string; password: string }> = {
    admin: { email: "admin@hospital.com", password: "1234" },
    doctor: { email: "doctor1@hospital.com", password: "1234" },
    patient: { email: "patient1@hospital.com", password: "1234" },
    pharmacist: { email: "pharma@hms.com", password: "123456" },
  };

  const fillDemo = (r: Role) => {
    setRole(r);
    setFormData(demoAccounts[r]);
  };

  return (
    <div className="w-full h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">

        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {role.charAt(0).toUpperCase() + role.slice(1)} Login
        </h2>

        {/* ROLE SELECT */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full px-4 py-2 mb-4 rounded-md bg-gray-700 text-white border border-gray-600"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
          <option value="pharmacist">Pharmacist</option>
        </select>

        {/* FORM */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600"
          />

          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600"
          />

          <button
            type="submit"
            className="bg-cyan-600 text-white py-2 rounded-md font-semibold hover:bg-cyan-700 transition"
          >
            Login
          </button>
        </form>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-center mt-4">{error}</p>
        )}

        {/* DEMO */}
        <div className="mt-6 border-t border-gray-700 pt-4">
          <p className="text-gray-400 text-sm text-center mb-3">
            Demo Accounts
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(["admin", "doctor", "patient", "pharmacist"] as Role[]).map(
              (r) => (
                <button
                  key={r}
                  onClick={() => fillDemo(r)}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm"
                >
                  {r}
                </button>
              )
            )}
          </div>
        </div>

        {/* SIGNUP */}
        <p className="text-gray-400 text-center mt-4">
          Don't have an account?{" "}
          <span
            className="text-cyan-400 cursor-pointer hover:underline"
            onClick={() => router.push("/auth/register")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}