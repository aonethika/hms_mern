"use client";
import useDoctorStore from "@/app/shared/store/doctor.store";
import useDepartmentStore from "@/app/shared/store/department.store";
import React, { useEffect, useMemo, useState } from "react";
import { deactivateDoctorAdminApi, reactivateDoctorAdminApi } from "@/app/shared/api/admin.api";
import { useRouter } from "next/navigation";

export default function Page() {

    const router = useRouter();
  const { doctors, fetchDoctors } = useDoctorStore();
  const { departments, fetchDepartments } = useDepartmentStore();

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Deactivate this doctor?")) return;
    await deactivateDoctorAdminApi(id);
    fetchDoctors();
  };

  const handleReactivate = async (id: string) => {
    if (!window.confirm("Reactivate this doctor?")) return;
    await reactivateDoctorAdminApi(id);
    fetchDoctors();
  };

  const filteredDoctors = useMemo(() => {
    return doctors?.filter((doc: any) => {
      const matchSearch =
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.phone.includes(search);

      const matchDepartment = departmentFilter
        ? doc.departmentId?.id === departmentFilter ||
          doc.departmentId?._id === departmentFilter
        : true;

      const matchStatus = statusFilter ? doc.status === statusFilter : true;

      return matchSearch && matchDepartment && matchStatus;
    });
  }, [doctors, search, departmentFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <input
          className="flex-1 p-2 rounded-md bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Search doctors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="p-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments?.map((dep: any) => (
            <option key={dep._id} value={dep._id}>
              {dep.name}
            </option>
          ))}
        </select>
        <select
          className="p-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredDoctors?.map((doc: any) => (
          <div
            key={doc._id}
            className="bg-gray-900 p-4 rounded-xl shadow-md border border-gray-800 hover:shadow-lg transition-shadow"
            onClick={()=> router.push(`/admin/doctors/${doc._id}`)}
          >
            <h2 className="text-lg font-semibold">{doc.name}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {doc.departmentId?.name || "No Department"}
            </p>
            <p className="text-gray-400 text-sm mt-1">{doc.phone}</p>
            <p
              className={`mt-2 font-medium text-sm ${
                doc.status === "available" ? "text-green-400" : "text-red-400"
              }`}
            >
              {doc.status.toUpperCase()}
            </p>

            <div className="mt-4 flex gap-2">
              {doc.status === "available" ? (
                <button
                  onClick={() => handleDeactivate(doc._id)}
                  className="flex-1 py-1 rounded-md bg-red-900  hover:bg-brown-900 transition"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => handleReactivate(doc._id)}
                  className="flex-1 py-1 rounded-md bg-green-600 hover:bg-green-700 transition"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}