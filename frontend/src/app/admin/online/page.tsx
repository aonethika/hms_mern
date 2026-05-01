"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getOnlineBookingsApi,
  generateTokenApi,
} from "@/app/shared/api/appointments.api";
import VitalsModal from "../components/VitalsModal";

const getToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const isToday = (date: string) => {
  const today = new Date().toISOString().split("T")[0];
  return date === today;
};

export default function Page() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showVitals, setShowVitals] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [selectedVitals, setSelectedVitals] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getOnlineBookingsApi(selectedDate);
      setAppointments(res.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleGenerateToken = async (appointmentId: string) => {
    try {
      setGeneratingId(appointmentId);
      await generateTokenApi(appointmentId);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredAppointments = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return appointments;

    return appointments.filter((appt: any) => {
      const patientName =
        appt.patient?.name || appt.patientId?.name || "";
      const phone =
        appt.patient?.phone || appt.patientId?.phone || "";
      const doctorName = appt.doctorId?.name || "";

      return (
        patientName.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q) ||
        doctorName.toLowerCase().includes(q)
      );
    });
  }, [appointments, search]);

  const openVitals = (appointmentId: string, vitals: any) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedVitals(vitals || null);
    setShowVitals(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <h1 className="text-lg font-semibold">Online Bookings</h1>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search patient / phone / doctor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-sm px-3 py-1.5 rounded w-full sm:w-64"
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-sm px-3 py-1.5 rounded"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAppointments.map((appt: any) => (
            <div
              key={appt._id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-white">
                    {appt.patient?.name || appt.patientId?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {appt.patient?.phone || appt.patientId?.phone}
                  </p>
                  <p className="text-xs text-cyan-400">
                    Dr.{appt.doctorId?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {appt.departmentId?.name}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {appt.token || "-"}
                  </p>

                  {isToday(selectedDate) &&
                    !appt.token &&
                    !appt.tokenGeneratedAt && (
                      <button
                        onClick={() => handleGenerateToken(appt._id)}
                        disabled={generatingId === appt._id}
                        className="text-[10px] px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white disabled:opacity-50 mt-1"
                      >
                        {generatingId === appt._id
                          ? "Generating..."
                          : "Generate Token"}
                      </button>
                    )}
                </div>
              </div>

              {isToday(selectedDate) && (
                <button
                  onClick={() => openVitals(appt._id, appt.vitals)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-xs px-3 py-1 rounded w-full"
                >
                  {appt.vitals ? "Edit Vitals" : "Add Vitals"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showVitals && (
        <VitalsModal
          appointmentId={selectedAppointmentId}
          vitals={selectedVitals}
          onClose={() => setShowVitals(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}