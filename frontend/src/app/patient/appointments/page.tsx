"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyAppointments } from "@/app/shared/api/patient.api";
import useAuthStore from "@/app/shared/store/auth.store";

export default function AppointmentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { selectedPatient } = useAuthStore();

  // Fetch appointments whenever selected patient changes
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await getMyAppointments(selectedPatient?._id);
        setData(res?.appointments || []);
      } catch {
        setData([]);
      }
      setLoading(false);
    };

    if (selectedPatient?._id) fetchAppointments();
  }, [selectedPatient]);

  // Filter appointments based on search and status
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item?.doctorId?.name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchStatus =
        status === "all" ? true : item?.status === status;

      return matchSearch && matchStatus;
    });
  }, [data, search, status]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6 md:p-8">
      {/* Page Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        My Appointments
      </h1>

      {/* Search and Status Filter */}
      <div className="max-w-xl mx-auto mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by doctor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
        >
          <option value="all">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Appointments List */}
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {filteredData.map((item) => (
          <div
            key={item._id}
            className="bg-gray-900 rounded-xl p-4 shadow-md hover:shadow-cyan-500/10 transition duration-300"
          >
            {/* Doctor Name and Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
              <p className="text-white font-semibold text-sm sm:text-base">
                Dr. {item?.doctorId?.name || "Unknown"}
              </p>

              <span
                className={`text-xs px-2 py-1 rounded-full capitalize ${
                  item?.status === "completed"
                    ? "bg-green-500/20 text-green-400"
                    : item?.status === "scheduled"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {item?.status}
              </span>
            </div>

            {/* Doctor Specialization & Department */}
            <p className="text-sm text-gray-400 mb-1">
              {item?.doctorId?.specialization || "General"} •{" "}
              {item?.departmentId?.name || "Dept"}
            </p>

            {/* Appointment Source */}
            <p className="text-sm text-gray-300 mb-2">{item?.source}</p>

            {/* Date & Queue Status */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>{new Date(item?.date).toLocaleDateString()}</span>
              <span>{item?.queueStatus}</span>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {!filteredData.length && (
          <p className="text-gray-400 text-center mt-10">
            No appointments found
          </p>
        )}
      </div>
    </div>
  );
}