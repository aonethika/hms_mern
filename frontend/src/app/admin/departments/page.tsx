"use client";

import React, { useEffect, useState } from "react";
import useDepartmentStore from "@/app/shared/store/department.store";
import {
  addDepartmentApi,
  updateDepartmentApi,
  deleteDepartmentApi,
} from "@/app/shared/api/department.api";

export default function page() {
  const { departments, loading, error, fetchDepartments } = useDepartmentStore();
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAddDepartment = async () => {
    if (!name.trim()) return;
    await addDepartmentApi({ name: name.trim() });
    fetchDepartments();
    setName("");
  };

  const handleEditDepartment = async (id: string) => {
    if (!editName.trim()) return;
    await updateDepartmentApi(id, { name: editName.trim() });
    fetchDepartments();
    setEditId(null);
    setEditName("");
  };

  const handleDeleteDepartment = async (id: string) => {
    await deleteDepartmentApi(id);
    fetchDepartments();
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen flex justify-center bg-gray-950 p-6">
      <div className="w-full max-w-200 mt-2">
        <h1 className="text-2xl font-semibold text-center text-cyan-400 mb-6">
          Departments
        </h1>

        {/* Add Department Form */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New Department"
            className="flex-1 px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <button
            onClick={handleAddDepartment}
            className="px-4 py-2 bg-cyan-400 hover:bg-cyan-500 rounded-md transition text-gray-100"
          >
            Add
          </button>
        </div>

        {loading && <p className="text-gray-400 mb-4 text-center">Loading...</p>}
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {/* Department List */}
        <ul className="space-y-3">
          {departments?.map((dept) => (
            <li
              key={dept._id}
              className="flex items-center justify-between p-3 bg-gray-900 rounded-md border border-gray-800"
            >
              {editId === dept._id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => handleEditDepartment(dept._id)}
                      className="px-3 py-1 bg-cyan-400 hover:bg-cyan-500 rounded-md transition text-gray-100"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md transition text-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span>{dept.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditId(dept._id);
                        setEditName(dept.name);
                      }}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md transition text-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept._id)}
                      className="px-3 py-1 bg-red-900 hover:bg-red-600 rounded-md transition text-gray-100"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}