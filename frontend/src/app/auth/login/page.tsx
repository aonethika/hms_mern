"use client";

import { userLogin } from '@/app/shared/api/auth.api';
import useAuthStore from '@/app/shared/store/auth.store';
import { LoginResponse } from '@/app/shared/types/auth';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function LoginPage() {

    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [role, setRole] = useState<"patient" | "admin" | "doctor">("patient");
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res: LoginResponse = await userLogin({ ...formData, role });
            login(res);
            localStorage.setItem("token", res.token);

            setTimeout(() => {
                if (res.user.role === "admin") router.push("/admin/dashboard");
                else if (res.user.role === "doctor") router.push("/doctor/dashboard");
                else router.push("/patient/dashboard");
            }, 50);

        } catch (err: any) {
            console.log("Login error", err.response?.data, err.message);
            setError(err.response?.data?.message || "Login Failed");
        }
    }

    return (
        <div className="w-full h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-white text-center mb-6">
                    {role.charAt(0).toUpperCase() + role.slice(1)} Login
                </h2>

                {/* Role Buttons */}
                <div className="flex justify-center gap-3 mb-6">
                    {["patient", "doctor", "admin"].map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r as any)}
                            className={`px-4 py-2 rounded-md font-medium transition ${
                                role === r
                                    ? "bg-cyan-600 text-white"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                        >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        required
                        className="px-4 py-2 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        required
                        className="px-4 py-2 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                        type="submit"
                        className="bg-cyan-600 text-white py-2 rounded-md font-semibold hover:bg-cyan-700 transition"
                    >
                        Login
                    </button>
                </form>

                {error && (
                    <p className="text-red-500 text-center mt-4">{error}</p>
                )}

                {/* Signup Link */}
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