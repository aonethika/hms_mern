"use client";
import { adminDashboardStatsApi } from "@/app/shared/api/admin.api";
import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalAppointmentsToday: number;
  remainingAppointments: number;
  completedAppointments: number;
}

export default function Page() {

  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      const res = await adminDashboardStatsApi();
      setDashboardStats(res.stats);
    };
    fetchDashboardStats();
  }, []);

  return (
   <div className="p-6 min-h-screen flex flex-col items-center space-y-6">
  <button
    className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-white px-8 py-3 rounded-md shadow-lg font-semibold hover:from-cyan-600 hover:to-cyan-500 transition transform hover:scale-105"
    onClick={() => router.push("/admin/create-appointment")}
  >
    Book Appointment +
  </button>

  <button
    className="bg-gray-200 hover:bg-cyan-400 text-gray-950 px-6 py-3 rounded-md shadow-lg w-full max-w-lg flex items-center justify-center font-semibold transition transform hover:scale-105"
    onClick={() => router.push("/admin/doctor-queue")}
  >
    Doctor Queue
    <ArrowRight size={20} className="ml-2" />
  </button>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl py-10">
    <div
      className="bg-gradient-to-br from-cyan-700 to-cyan-900 shadow-xl rounded-2xl p-6 flex flex-col items-center justify-center hover:scale-105 transform transition"
      onClick={() => router.push("/admin/appointments")}
    >
      <div className="text-gray-300 text-lg font-medium">
        Today Appointments
      </div>
      <div className="text-4xl font-bold mt-2">
        {dashboardStats?.totalAppointmentsToday ?? 0}
      </div>
    </div>

    <div
      className="bg-gradient-to-br from-cyan-700 to-cyan-800 shadow-xl rounded-2xl p-6 flex flex-col items-center justify-center hover:scale-105 transform transition"
      onClick={() => router.push("/admin/remaining")}
    >
      <div className="text-gray-300 text-lg font-medium">
        Remaining Appointments
      </div>
      <div className="text-4xl font-bold mt-2">
        {dashboardStats?.remainingAppointments ?? 0}
      </div>
    </div>

    <div
      className="bg-gradient-to-br from-cyan-700 to-cyan-900 shadow-xl rounded-2xl p-6 flex flex-col items-center justify-center hover:scale-105 transform transition"
      onClick={() => router.push("/admin/completed")}
    >
      <div className="text-gray-300 text-lg font-medium">
        Completed Appointments
      </div>
      <div className="text-4xl font-bold mt-2">
        {dashboardStats?.completedAppointments ?? 0}
      </div>
    </div>

    <div className="col-span-1 sm:col-span-2 md:col-span-3 flex justify-center">
      <div
        className="bg-gradient-to-br from-cyan-600 to-cyan-500 shadow-xl rounded-2xl p-6 flex items-center justify-center hover:scale-105 transform transition cursor-pointer w-full max-w-md"
        onClick={() => router.push("/admin/online")}
      >
        <div className="text-gray-100 text-lg font-medium">
          Online Bookings
        </div>
      </div>
    </div>
  </div>
</div>
  );
}