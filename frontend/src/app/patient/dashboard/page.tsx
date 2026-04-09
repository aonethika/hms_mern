"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/app/shared/store/auth.store";
import {
  getMyPatientsApi,
  getPatientDashboardStatsApi,
} from "@/app/shared/api/patient.api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { setPatients, patients, selectedPatient } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  // Fetch dashboard stats for selected patient
  const fetchStats = async () => {
    if (!selectedPatient?._id) return;
    const res = await getPatientDashboardStatsApi(selectedPatient._id);
    setStats(res);
  };

  // Fetch patients if not already fetched
  useEffect(() => {
    const fetchPatients = async () => {
      if (patients.length > 0) return;
      const res = await getMyPatientsApi();
      setPatients(res.patients);
    };
    fetchPatients();
  }, []);

  // Update stats when selected patient changes
  useEffect(() => {
    fetchStats();
  }, [selectedPatient]);

  if (!stats) return null;

  const cards = [
    {
      label: "Upcoming",
      value: stats.stats.upcomingAppointments,
      route: "/patient/upcoming",
    },
    {
      label: "Prescriptions",
      value: stats.stats.prescriptions,
      route: "/patient/prescriptions",
    },
    {
      label: "Visits",
      value: stats.stats.visits,
      route: "/patient/visits",
    },
    {
      label: "Follow Ups",
      value: stats.stats.followUps,
      route: "/patient/followups",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-6 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Book Appointment Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => router.push("/patient/book-appointment")}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-3 rounded-xl shadow-lg transition transform hover:scale-105"
          >
            + Book Appointment
          </button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {cards.map((item, i) => (
            <div
              key={i}
              onClick={() => {
                if (item.label === "Visits") {
                  alert(`You visited ${item.value} times`);
                } else {
                  router.push(item.route);
                }
              }}
              className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-md hover:shadow-cyan-500/10 hover:scale-105 transition cursor-pointer"
            >
              <p className="text-gray-400 text-sm mb-1">{item.label}</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-cyan-400">
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Next Appointment & Last Visit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Next Appointment Card */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-md hover:shadow-cyan-500/10 transition">
            <h2 className="text-lg sm:text-xl font-semibold text-cyan-400 mb-4">
              Next Appointment
            </h2>

            {stats.nextAppointment ? (
              <div className="text-gray-300 space-y-2 text-sm sm:text-base">
                <p>
                  <span className="text-gray-500">Date:</span>{" "}
                  {stats.nextAppointment?.date
                    ? new Date(stats.nextAppointment.date).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <span className="text-gray-500">Doctor:</span>{" "}
                  {stats.nextAppointment.doctorId?.name || "N/A"}
                </p>
                <p>
                  <span className="text-gray-500">Status:</span>{" "}
                  {stats.nextAppointment.status}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm sm:text-base">No upcoming appointment</p>
            )}
          </div>

          {/* Last Visit Card */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-md hover:shadow-cyan-500/10 transition">
            <h2 className="text-lg sm:text-xl font-semibold text-cyan-400 mb-4">
              Last Visit
            </h2>

            {stats.lastVisit ? (
              <div className="text-gray-300 space-y-2 text-sm sm:text-base">
                <p>
                  <span className="text-gray-500">Date:</span>{" "}
                  {stats.lastVisit?.date
                    ? new Date(stats.lastVisit.date).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <span className="text-gray-500">Doctor:</span>{" "}
                  {stats.lastVisit.doctorId?.name || "N/A"}
                </p>
                <p>
                  <span className="text-gray-500">Notes:</span>{" "}
                  {stats.lastVisit.notes || "N/A"}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm sm:text-base">No visit history</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}