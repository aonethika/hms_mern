"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEdit } from "react-icons/fi";
import useAuthStore from "@/app/shared/store/auth.store";
import useDepartmentStore from "@/app/shared/store/department.store";
import { getMyProfileApi, updateProfile } from "@/app/shared/api/doctor.api";
import { changePasswordApi } from "@/app/shared/api/auth.api";

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: "female" | "male" | "other";
  consultationFee: string | "";
  qualifications: string[];
  specialization: string;
  departmentId: { id: string; name: string };
  workingHours: { startTime: string; endTime: string };
}

export default function Page() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { departments, fetchDepartments } = useDepartmentStore();

  const [editMode, setEditMode] = useState(false);
  const [isChangePassword, setIsChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [formData, setFormData] = useState<Doctor>({
    id: "",
    name: "",
    email: "",
    phone: "",
    gender: "male",
    consultationFee: "",
    qualifications: [],
    specialization: "",
    departmentId: { id: "", name: "" },
    workingHours: { startTime: "10:00", endTime: "17:00" },
  });

  const [initialData, setInitialData] = useState(formData);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfileApi();
        if (res.success) {
          const d = res.doctor;
          const dept = departments.find((dep) => dep._id === d.departmentId?._id);
          const departmentName = dept?.name || d.departmentId?.name || "";

          const profile: Doctor = {
            id: d._id,
            name: d.name || "",
            email: d.email || "",
            phone: d.phone || "",
            gender: d.gender || "male",
            consultationFee: d.consultationFee?.toString() || "",
            qualifications: d.qualification || [],
            specialization: d.specialization || "",
            departmentId: { id: d.departmentId?._id || "", name: departmentName },
            workingHours: {
              startTime: d.workingHours?.startTime || "10:00",
              endTime: d.workingHours?.endTime || "17:00",
            },
          };

          setFormData(profile);
          setInitialData(profile);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (departments.length) fetchProfile();
  }, [departments]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        departmentId: formData.departmentId.id,
        qualification: formData.qualifications,
        workingHours: { ...formData.workingHours },
      };

      const res = await updateProfile(payload);
      if (res.success) {
        setEditMode(false);
        setInitialData(formData);
      } else {
        alert(res.message || "Update failed");
      }
    } catch {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(initialData);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handlePasswordSubmit = async (e: any) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return alert("All fields are required");

    setPasswordLoading(true);
    try {
      const res = await changePasswordApi({ oldPassword, newPassword });
      if (res.success) {
        setIsChangePassword(false);
        setOldPassword("");
        setNewPassword("");
      }
    } catch {
      alert("Incorrect old password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const closePasswordModal = () => {
    setIsChangePassword(false);
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <div className="bg-gray-950 min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row gap-10">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            {!editMode && (
              <div className="cursor-pointer p-2 bg-gray-800 rounded-full hover:bg-cyan-700 transition" onClick={() => setEditMode(true)}>
                <FiEdit className="text-cyan-400 text-xl" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Full Name", key: "name", type: "text" },
              { label: "Email", key: "email", type: "text" },
              { label: "Phone", key: "phone", type: "text" },
              { label: "Specialization", key: "specialization", type: "text" },
              { label: "Consultation Fee", key: "consultationFee", type: "text" },
              { label: "Gender", key: "gender", type: "select", options: ["male", "female", "other"] },
              { label: "Qualifications", key: "qualifications", type: "text" },
              { label: "Department", key: "departmentId", type: "select" },
              { label: "Working Hours Start", key: "startTime", type: "time" },
              { label: "Working Hours End", key: "endTime", type: "time" },
            ].map((field) => (
              <div key={field.key} className="flex flex-col md:flex-row items-center md:justify-between bg-gray-800 p-4 rounded-xl hover:bg-gray-700 transition">
                <span className="text-gray-400 w-full md:w-1/3 mb-1 md:mb-0">{field.label}</span>
                <div className="flex-1">
                  {editMode ? (
                    field.type === "select" && field.key === "gender" ? (
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as Doctor["gender"] })}
                        className="bg-gray-700 px-3 py-2 rounded text-white w-full"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.key === "qualifications" ? (
                      <input
                        type="text"
                        value={formData.qualifications.join(", ")}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            qualifications: e.target.value.split(",").map((q) => q.trim()),
                          })
                        }
                        className="bg-gray-700 px-3 py-2 rounded text-white w-full"
                      />
                    ) : field.key === "departmentId" ? (
                      <select
                        value={formData.departmentId.id}
                        onChange={(e) => {
                          const dept = departments.find((d) => d._id === e.target.value);
                          if (dept) setFormData({ ...formData, departmentId: { id: dept._id, name: dept.name } });
                        }}
                        className="bg-gray-700 px-3 py-2 rounded text-white w-full"
                      >
                        <option value="">Select department</option>
                        {departments.map((dep) => (
                          <option key={dep._id} value={dep._id}>{dep.name}</option>
                        ))}
                      </select>
                    ) : field.key === "startTime" || field.key === "endTime" ? (
                      <input
                        type="time"
                        value={field.key === "startTime" ? formData.workingHours.startTime : formData.workingHours.endTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            workingHours: { ...formData.workingHours, [field.key]: e.target.value },
                          })
                        }
                        className="bg-gray-700 px-3 py-2 rounded text-white w-full"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key as keyof Doctor] as string}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="bg-gray-700 px-3 py-2 rounded text-white w-full"
                      />
                    )
                  ) : (
                    <span className="text-gray-200">{(() => {
                      if (field.key === "qualifications") return formData.qualifications.join(", ");
                      if (field.key === "departmentId") return formData.departmentId.name;
                      if (field.key === "startTime") return formData.workingHours.startTime;
                      if (field.key === "endTime") return formData.workingHours.endTime;
                      return formData[field.key as keyof Doctor] as string;
                    })()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {editMode && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded disabled:opacity-50 transition"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={() => setIsChangePassword(true)}
            className="mt-6 w-full border border-gray-600 hover:bg-gray-700 text-gray-300 py-2 rounded transition"
          >
            Change Password
          </button>

          <button
            onClick={handleLogout}
            className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>

      {isChangePassword && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <form onSubmit={handlePasswordSubmit} className="bg-gray-800 p-6 rounded-2xl w-[350px] space-y-4">
            <h2 className="text-white text-lg font-semibold text-center">Change Password</h2>

            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-gray-700 px-3 py-2 rounded text-white"
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-700 px-3 py-2 rounded text-white"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded disabled:opacity-50 transition"
              >
                {passwordLoading ? "Updating..." : "Update"}
              </button>

              <button
                type="button"
                onClick={closePasswordModal}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}