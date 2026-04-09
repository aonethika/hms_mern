"use client";

import { useEffect, useState } from "react";
import {
  getUpcomingAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getDoctorSlots,
} from "@/app/shared/api/patient.api";
import useAuthStore from "@/app/shared/store/auth.store";

export const calculateAge = (dob?: string) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export default function UpcomingAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState<null | any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [newDate, setNewDate] = useState("");

  const { selectedPatient } = useAuthStore();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      if (!selectedPatient?._id) return;
      const res = await getUpcomingAppointments(selectedPatient._id);
      setAppointments(res?.appointments || res?.data || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatient?._id) fetchAppointments();
  }, [selectedPatient]);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await cancelAppointment(id);
      fetchAppointments();
    } catch {}
  };

  const openRescheduleModal = async (appt: any) => {
    setRescheduleModal(appt);
    setNewDate("");
    setSlots([]);
    setSelectedSlot(null);
  };

  const fetchSlots = async (date: string) => {
    if (!rescheduleModal?.doctorId?._id) return;
    const res = await getDoctorSlots(rescheduleModal.doctorId._id, date);
    setSlots(res?.slots || []);
  };

  const handleReschedule = async () => {
    if (!newDate || !selectedSlot) return;
    if (selectedSlot.bookings >= 3) return;
    let [startTime, endTime] = selectedSlot.time?.split(" - ") || [selectedSlot.startTime, selectedSlot.endTime];
    await rescheduleAppointment(rescheduleModal._id, { newDate, timeSlot: { startTime, endTime } });
    setRescheduleModal(null);
    fetchAppointments();
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-8">Upcoming Appointments</h1>

        {loading && <div className="text-center">Loading...</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {appointments.map((appt: any) => (
            <div
              key={appt._id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:shadow-lg transition"
            >
              <h2 className="text-sm text-cyan-400">Dr. {appt.doctorId?.name}</h2>
              <p className="text-xs text-gray-400">{appt.departmentId?.name}</p>
              <p className="text-xs">{new Date(appt.date).toLocaleDateString()}</p>
              <p className="text-xs">{appt.timeSlot?.startTime} - {appt.timeSlot?.endTime}</p>

              <div className="mt-3 flex flex-col gap-2">
                {appt.source === "online" && (
                  <button
                    onClick={() => openRescheduleModal(appt)}
                    className="bg-yellow-500/20 text-yellow-400 text-xs py-1 rounded hover:bg-yellow-500/30 transition"
                  >
                    Reschedule
                  </button>
                )}

                <button
                  onClick={() => handleCancel(appt._id)}
                  className="bg-red-500/20 text-red-400 text-xs py-1 rounded hover:bg-red-500/30 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Reschedule Modal */}
        {rescheduleModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-sm space-y-4">
              <h2 className="text-white text-lg text-center mb-2">Reschedule Appointment</h2>
              <input
                type="date"
                value={newDate}
                min={today}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setSelectedSlot(null);
                  fetchSlots(e.target.value);
                }}
                className="w-full bg-gray-700 px-3 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />

              <div className="grid grid-cols-2 gap-2 mt-2">
                {slots.map((slot: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => slot.bookings < 3 && setSelectedSlot(slot)}
                    disabled={slot.bookings >= 3}
                    className={`text-xs py-1 rounded transition ${
                      selectedSlot === slot ? "bg-cyan-500 text-black" :
                      slot.bookings >= 3 ? "bg-gray-700 opacity-50 cursor-not-allowed" :
                      "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    {slot.time || `${slot.startTime} - ${slot.endTime}`}
                  </button>
                ))}
              </div>

              <button
                onClick={handleReschedule}
                className="w-full bg-cyan-500 text-black py-2 rounded mt-2 hover:bg-cyan-400 transition"
              >
                Confirm
              </button>

              <button
                onClick={() => setRescheduleModal(null)}
                className="w-full bg-gray-600 text-white py-2 rounded mt-2 hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}