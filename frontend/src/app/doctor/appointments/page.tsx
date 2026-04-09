'use client';

import { getAppointments } from '@/app/shared/api/doctor.api';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const fetchAppointments = async (selectedDate?: string, selectedStatus?: string) => {
    const res = await getAppointments(selectedDate, selectedStatus);
    console.log("APPOINMET", res);
    
    setAppointments(res.appointments || []);
  };

  useEffect(() => {
    fetchAppointments(date, status);
  }, [date, status]);

  useEffect(() => {
    setFilteredAppointments(
      appointments.filter(
        (app) =>
          app.patientId?.name.toLowerCase().includes(search.toLowerCase()) ||
          app.patientId?.phone.includes(search)
      )
    );
  }, [search, appointments]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 rounded bg-gray-900 border border-gray-700 text-white w-full sm:w-48"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="p-2 rounded bg-gray-900 border border-gray-700 text-white w-full sm:w-48"
        >
          <option value="">All Status</option>
          <option value="waiting">Waiting</option>
          <option value="completed">Completed</option>
          <option value="done">Done</option>
          <option value="no-show">No Show</option>
        </select>
        <input
          type="text"
          placeholder="Search by name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 rounded bg-gray-900 border border-gray-700 text-white w-full sm:flex-1"
        />
      </div>

     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAppointments.length > 0 ? (
            filteredAppointments.map((app) => (
            <div
                key={app._id}
                onClick={() => router.push(`/doctor/patient/${app._id}`)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:shadow-xl hover:border-cyan-700 transition-all duration-200 transform hover:scale-[1.02]"
            >
                <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">
                    Token #{app.token || "-"}
                </span>

                <span
                    className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    app.queueStatus === "waiting"
                        ? "bg-yellow-900/40 text-yellow-400"
                        : app.queueStatus === "in_consultation"
                        ? "bg-cyan-900/40 text-cyan-400"
                        : app.queueStatus === "done"
                        ? "bg-green-900/40 text-green-400"
                        : "bg-red-900/40 text-red-400"
                    }`}
                >
                    {app.queueStatus
                    .split("_")
                    .map(
                        (word: string) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(" ")}
                </span>
                </div>

                <div className="mb-2">
                <h2 className="text-base font-semibold text-white truncate">
                    {app.patientId?.name}
                </h2>
                <p className="text-xs text-gray-400 truncate">
                    {app.patientId?.phone}
                </p>
                </div>

                <div className="text-xs text-gray-500 space-y-0.5">
                <p>{app.patientId?.gender}</p>
                <p>{new Date(app.date).toLocaleString()}</p>
                </div>

                {app.source === "online" && (
                <div className="mt-3 text-xs text-cyan-400 font-medium">
                    {app.timeSlot?.startTime} - {app.timeSlot?.endTime}
                </div>
                )}
            </div>
            ))
        ) : (
            <p className="col-span-full text-center text-gray-500 mt-10">
            No appointments found
            </p>
        )}
        </div>
            </div>
        );
}