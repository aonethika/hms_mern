"use client";

import { addDoctorAdminApi } from "@/app/shared/api/admin.api";
import useDepartmentStore from "@/app/shared/store/department.store";
import useDoctorStore from "@/app/shared/store/doctor.store";
import React, { useEffect, useState } from "react";

export default function Page() {
  const { loading } = useDoctorStore();
  const { departments, fetchDepartments } = useDepartmentStore();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "male",
    consultationFee: "",
    qualifications: "",
    specialization: "",
    departmentId: "",
    startTime: "10:00",
    endTime: "17:00",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
const handleSubmit = async (e: any) => {
  e.preventDefault();

  if (
    !form.name ||
    !form.email ||
    !form.phone ||
    !form.consultationFee ||
    !form.specialization ||
    !form.qualifications ||
    !form.departmentId ||
    !form.startTime ||
    !form.endTime
  ) {
    alert("Please fill all fields");
    return;
  }

  if (form.startTime >= form.endTime) {
    alert("End time must be after start time");
    return;
  }

  try {
    const payload = {
      ...form,
      consultaionFee: Number(form.consultationFee),
      qualification: form.qualifications.split(",").map((q) => q.trim()),
      workingHours: {
        startTime: form.startTime,
        endTime: form.endTime,
      },
    };

    await addDoctorAdminApi(payload);

    setForm({
      name: "",
      email: "",
      phone: "",
      gender: "male",
      consultationFee: "",
      qualifications: "",
      specialization: "",
      departmentId: "",
      startTime: "10:00",
      endTime: "17:00",
    });

    alert("Doctor added successfully");
  } catch (err: any) {
    console.error(err);

    const message =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";

    alert(message);
    }
}
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-gray-900 p-6 rounded-xl shadow-lg space-y-5"
      >
        <h2 className="text-xl font-semibold">Add Doctor</h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="bg-gray-800 p-3 rounded-lg outline-none"
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="bg-gray-800 p-3 rounded-lg outline-none"
          />

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="bg-gray-800 p-3 rounded-lg outline-none"
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="bg-gray-800 p-3 rounded-lg outline-none"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input
            name="consultationFee"
            placeholder="Consultation Fee"
            value={form.consultationFee}
            onChange={handleChange}
            className="bg-gray-800 p-3 rounded-lg outline-none"
          />

          <input
            name="specialization"
            placeholder="Specialization"
            value={form.specialization}
            onChange={handleChange}
            className="bg-gray-800 p-3 rounded-lg outline-none col-span-2"
          />

          <input
            name="qualifications"
            placeholder="Qualifications (comma separated)"
            value={form.qualifications}
            onChange={handleChange}
            className="bg-gray-800 p-3 rounded-lg outline-none col-span-2"
          />

          <select
            name="departmentId"
            value={form.departmentId}
            onChange={handleChange}
            className="bg-gray-800 p-3 rounded-lg outline-none col-span-2"
          >
            <option value="">Select Department</option>
            {departments?.map((dept: any, index: number) => (
              <option key={dept?.id || dept?._id || index} value={dept?.id || dept?._id}>
                {dept?.name}
              </option>
            ))}
          </select>

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="bg-gray-800 p-3 rounded-lg outline-none"
            />

            <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="bg-gray-800 p-3 rounded-lg outline-none"
            />
            </div>
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-400 text-black py-3 rounded-lg font-medium hover:opacity-90 transition"
        >
          {loading ? "Saving..." : "Add Doctor"}
        </button>
      </form>
    </div>
  );
}