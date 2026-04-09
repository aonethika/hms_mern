"use client";

import { editAdminProfileApi } from "@/app/shared/api/admin.api";
import { changePasswordApi } from "@/app/shared/api/auth.api";
import useAuthStore from "@/app/shared/store/auth.store";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { FiEdit } from "react-icons/fi";

export default function Page() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [editMode, setEditMode] = useState(false);
  const [isChangePassword, setIsChangePassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [formData, setFormData] = useState({ phone: "", email: "" });
  const [initialData, setInitialData] = useState({ phone: "", email: "" });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

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

  const handleSave = async () => {
    if (!formData.phone || !formData.email) {
      alert("All fields are required");
      return;
    }

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

    if (!oldPassword || !newPassword) {
      alert("All fields are required");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePasswordApi({ oldPassword, newPassword });

      if (res.success) {
        setIsChangePassword(false);
        setOldPassword("");
        setNewPassword("");
      }
    } catch (err) {
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
    <div className="bg-gray-950 min-h-screen flex items-center justify-center">
      <div className="w-[420px] bg-gray-800 p-8 rounded-2xl shadow-xl relative">

        {!editMode && (
          <div
            className="absolute top-4 right-4 cursor-pointer"
            onClick={() => setEditMode(true)}
          >
            <FiEdit className="text-cyan-400 text-xl" />
          </div>
        )}

        <h1 className="text-2xl font-semibold text-white mb-6 text-center">
          My Profile
        </h1>

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
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded disabled:opacity-50"
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

      {isChangePassword && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-gray-800 p-6 rounded-xl w-[350px] space-y-4"
          >
            <h2 className="text-white text-lg font-semibold text-center">
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
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded disabled:opacity-50"
              >
                {passwordLoading ? "Updating..." : "Update"}
              </button>
              <button
                type="button"
                onClick={closePasswordModal}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded"
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