"use client";

import { editAdminProfileApi } from "@/app/shared/api/admin.api";
import { changePasswordApi } from "@/app/shared/api/auth.api";
import {
  getMyPatientsApi,
  createPatient,
} from "@/app/shared/api/patient.api";
import useAuthStore from "@/app/shared/store/auth.store";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { FiEdit } from "react-icons/fi";

export default function Page() {
  const router = useRouter();

  const {
    user,
    logout,
    setPatients,
    patients,
    selectedPatient,
    setSelectedPatient,
  } = useAuthStore();

  const [editMode, setEditMode] = useState(false);
  const [isChangePassword, setIsChangePassword] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [formData, setFormData] = useState({ phone: "", email: "" });
  const [initialData, setInitialData] = useState({ phone: "", email: "" });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [newPatient, setNewPatient] = useState({
    name: "",
    gender: "",
    dob: "",
  });

  useEffect(() => {
    if (user) {
      const data = {
        phone: user.phone || "",
        email: user.email || "",
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [user]);

  useEffect(() => {
    const fetchPatients = async () => {
      if (patients.length > 0) return;
      const res = await getMyPatientsApi();
      setPatients(res.patients);
    };
    fetchPatients();
  }, []);

  const handleSave = async () => {
    if (!formData.phone || !formData.email) return;
    setLoading(true);
    try {
      const res = await editAdminProfileApi(formData);
      if (res.success) {
        setEditMode(false);
        setInitialData(formData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialData);
    setEditMode(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handlePasswordSubmit = async (e: any) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setPasswordLoading(true);
    try {
      const res = await changePasswordApi({ oldPassword, newPassword });
      if (res.success) {
        setIsChangePassword(false);
        setOldPassword("");
        setNewPassword("");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreatePatient = async (e: any) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.gender || !newPatient.dob) return;

    setCreateLoading(true);
    try {
      const res = await createPatient(newPatient);
      if (res.success) {
        const updated = await getMyPatientsApi();
        setPatients(updated.patients);
        setShowCreatePatient(false);
        setNewPatient({ name: "", gender: "", dob: "" });
      }
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen flex items-center justify-center">
      <div className="w-[450px] bg-gray-800 p-8 rounded-2xl shadow-xl relative">

        {!editMode && (
          <div
            className="absolute top-4 right-4 cursor-pointer"
            onClick={() => setEditMode(true)}
          >
            <FiEdit className="text-cyan-400 text-xl" />
          </div>
        )}

        <h1 className="text-2xl font-semibold text-white mb-4 text-center">
          My Profile
        </h1>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-5">
          <p className="text-gray-400 text-sm mb-2">Select Patient</p>

          <select
            value={selectedPatient?._id || ""}
            onChange={(e) => {
              const patient = patients.find(p => p._id === e.target.value);
              if (patient) setSelectedPatient(patient);
            }}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded-md outline-none border border-gray-700"
          >
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowCreatePatient(true)}
          className="mb-5 w-full bg-cyan-600 hover:bg-cyan-500 text-black py-2 rounded"
        >
          + Create New Patient
        </button>

        <div className="space-y-4 text-sm text-gray-300">
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Phone</span>
            {editMode ? (
              <input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="bg-gray-700 px-2 py-1 rounded text-white w-[60%]"
              />
            ) : (
              <span>{user?.phone}</span>
            )}
          </div>

          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="text-gray-400">Email</span>
            {editMode ? (
              <input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-gray-700 px-2 py-1 rounded text-white w-[60%]"
              />
            ) : (
              <span>{user?.email}</span>
            )}
          </div>
        </div>

        {editMode && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        )}

        <button
          onClick={() => setIsChangePassword(true)}
          className="mt-4 w-full border border-gray-600 hover:bg-gray-700 text-gray-300 py-2 rounded"
        >
          Change Password
        </button>

        <button
          onClick={handleLogout}
          className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
        >
          Logout
        </button>
      </div>

      {showCreatePatient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <form
            onSubmit={handleCreatePatient}
            className="bg-gray-800 p-6 rounded-xl w-[350px] space-y-4"
          >
            <h2 className="text-white text-lg text-center">
              Create Patient
            </h2>

            <input
              placeholder="Name"
              value={newPatient.name}
              onChange={(e) =>
                setNewPatient({ ...newPatient, name: e.target.value })
              }
              className="w-full bg-gray-700 px-3 py-2 rounded text-white"
            />

            <select
              value={newPatient.gender}
              onChange={(e) =>
                setNewPatient({ ...newPatient, gender: e.target.value })
              }
              className="w-full bg-gray-700 px-3 py-2 rounded text-white"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <input
              type="date"
              value={newPatient.dob}
              onChange={(e) =>
                setNewPatient({ ...newPatient, dob: e.target.value })
              }
              className="w-full bg-gray-700 px-3 py-2 rounded text-white"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-cyan-500 text-black py-2 rounded"
              >
                {createLoading ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreatePatient(false)}
                className="w-full bg-gray-600 text-white py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isChangePassword && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-gray-800 p-6 rounded-xl w-[350px] space-y-4"
          >
            <h2 className="text-white text-lg text-center">
              Change Password
            </h2>

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
                className="w-full bg-cyan-500 text-black py-2 rounded"
              >
                {passwordLoading ? "Updating..." : "Update"}
              </button>
              <button
                type="button"
                onClick={() => setIsChangePassword(false)}
                className="w-full bg-gray-600 text-white py-2 rounded"
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