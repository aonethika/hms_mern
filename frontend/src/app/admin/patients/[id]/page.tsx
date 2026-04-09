"use client";
import { getPatientHistory } from "@/app/shared/api/admin.api";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function Page() {
  const params = useParams();
  const patientId = params.id as string;

  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchHistory = async () => {
    const res = await getPatientHistory(patientId);
    if (res?.success) setAppointments(res.appointments);
  };

  useEffect(() => {
    if (patientId) fetchHistory();
  }, [patientId]);

  const filteredAppointments = appointments.filter((a) =>
    (a.doctorId?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "confirmed":
        return "bg-blue-500/20 text-blue-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      case "no-show":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-xl font-semibold mb-4">Patient History</h1>

      <input
        type="text"
        placeholder="Search by doctor name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xl mb-6 p-2 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-cyan-400"
      />

      <div className="space-y-4">
        {filteredAppointments.map((a: any) => (
          <div
            key={a._id}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <div className="text-cyan-400 font-semibold">
                Dr. {a.doctorId?.name}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-400">
                  {new Date(a.date).toLocaleDateString()}
                </div>
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyle(
                    a.status
                  )}`}
                >
                  {a.status}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-400">
              {a.departmentId?.name}
            </div>

            <div className="text-sm">
              <span className="text-gray-500">Specialization: </span>
              {a.doctorId?.specialization}
            </div>

            <div className="text-sm">
              <span className="text-gray-500">Qualification: </span>
              {a.doctorId?.qualification}
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <div className="text-gray-500 text-center mt-4">
            No appointments found.
          </div>
        )}
      </div>
    </div>
  );
}