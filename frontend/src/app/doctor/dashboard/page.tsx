"use client";

import React, { useEffect, useState } from "react";
import {
  getDoctorDashboardStats,
  getDoctorTodayQueue,
  skipCurrentPatientByDoctorApi,
} from "@/app/shared/api/doctor.api";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [current, setCurrent] = useState<any>(null);
  const [next, setNext] = useState<any>(null);

  const fetchDashboardStats = async () => {
    const res = await getDoctorDashboardStats();
    if (res?.success) setStats(res.stats);
  };

  const fetchTodayQueue = async () => {
    const res = await getDoctorTodayQueue();
    if (res?.success) {
      setCurrent(res.inConsultation || null);
      setNext(res.nextPatient || null);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchTodayQueue();
  }, []);

  const handleSkip = async (e: any) => {
    e.stopPropagation();
    await skipCurrentPatientByDoctorApi();
    await fetchTodayQueue();
    await fetchDashboardStats();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-950 text-white">
  
      {/* Current & Next Patient */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
        {/* Current Patient */}
        <div
          className={`p-6 rounded-xl border shadow-md flex flex-col justify-between bg-gray-900 ${
            current ? "border-cyan-700" : "border-gray-600"
          } cursor-pointer`}
          onClick={() => current && router.push(`/doctor/patient/${current._id}`)}
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Current Patient</h2>
          {current ? (
            <>
              <p className="text-lg font-bold text-white">{current.patient?.name}</p>
              <p className="text-sm font-semibold text-cyan-400 mt-1">{current.token}</p>
              <button
                onClick={(e) => handleSkip(e)}
                className="mt-4 px-4 py-2 text-sm rounded-md bg-red-700 hover:bg-red-600 transition-colors font-medium"
              >
                Skip
              </button>
            </>
          ) : (
            <p className="text-gray-400 italic">No current patient</p>
          )}
        </div>

        {/* Next Patient */}
        <div
          className={`p-6 rounded-xl border shadow-md flex flex-col justify-center bg-gray-900 ${
            next ? "border-cyan-700" : "border-gray-600"
          }`}
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Next Patient</h2>
          {next ? (
            <>
              <p className="text-lg font-bold text-white">{next.patient?.name}</p>
              <p className="text-sm font-semibold text-cyan-400 mt-1">{next.token}</p>
            </>
          ) : (
            <p className="text-gray-400 italic">No next patient</p>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="p-6 rounded-xl bg-cyan-600 text-center shadow-md cursor-pointer hover:bg-cyan-500 transition"
          onClick={() => router.push("/doctor/appointments")}
        >
          <p className="text-sm font-medium mb-2 text-white">Total Today</p>
          <h3 className="text-3xl font-bold">{stats?.totalToday || 0}</h3>
        </div>

        <div className="p-6 rounded-xl bg-cyan-600 text-center shadow-md">
          <p className="text-sm font-medium mb-2 text-white">Pending</p>
          <h3 className="text-3xl font-bold">{stats?.pendingToday || 0}</h3>
        </div>

        <div className="p-6 rounded-xl bg-cyan-600 text-center shadow-md">
          <p className="text-sm font-medium mb-2 text-white">Completed</p>
          <h3 className="text-3xl font-bold">{stats?.completedToday || 0}</h3>
        </div>
      </div>
    </div>
  );
}