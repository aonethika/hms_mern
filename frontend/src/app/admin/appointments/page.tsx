"use client";

import { getAvailableDoctorsByDateAdmin } from "@/app/shared/api/admin.api";
import { getAllAppointmentsApi } from "@/app/shared/api/appointments.api";
import React, { useEffect, useState } from "react";

const getToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export default function Page() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const doctorsRes = await getAvailableDoctorsByDateAdmin(selectedDate);

        const result = await Promise.all(
          doctorsRes.data.map(async (doc: any) => {
            const appointmentsRes = await getAllAppointmentsApi(doc.doctorId, selectedDate);
            console.log(appointmentsRes);
            
            const sorted = (appointmentsRes.appointments || []).sort(
              (a: any, b: any) =>
                new Date(a.tokenGeneratedAt).getTime() - new Date(b.tokenGeneratedAt).getTime()
            );
            return { doctor: doc, appointments: sorted };
          })
        );

        setData(result);
      } catch (err) {
        console.error("Error fetching appointments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  console.log(data);
  

  const getStatusLabel = (queueStatus: string) => {
    switch (queueStatus) {
      case "in_consultation":
        return "Consulting";
      case "waiting":
        return "Waiting";
      case "done":
        return "Completed";
      case "no_show":
        return "No-show";
      default:
        return "Unknown";
    }
  };

  const getStatusClasses = (queueStatus: string) => {
    switch (queueStatus) {
      case "in_consultation":
        return "bg-blue-900/40 text-blue-400";
      case "waiting":
        return "bg-yellow-900/40 text-yellow-400";
      case "done":
        return "bg-green-900/40 text-green-400";
      case "no_show":
        return "bg-red-900/40 text-red-400";
      default:
        return "bg-gray-700/40 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Doctor Queue</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-sm px-3 py-1.5 rounded focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-gray-400">Loading appointments...</p>
      ) : (
        <div className="space-y-6">
          {data.map((item, index) => (
            <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium text-gray-100">
                  {item.doctor.name || item.doctor.doctorName}
                </h2>
                <span className="text-xs text-gray-400">
                  {item.appointments.length === 1
                    ? `${item.appointments.length} patient`
                    : `${item.appointments.length} patients`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {item.appointments.map((appt: any, i: number) => (
                  <div
                    key={i}
                    className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex items-center justify-between ${
                      appt.queueStatus === "no_show" ? "opacity-80" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-100 truncate">
                        {appt.patient?.name || appt.patientId?.name}
                      </p>
                      <p className="text-xs text-gray-400">{appt.source}</p>
                    </div>

                    <div className="text-center mx-2">
                      <p className="text-base font-semibold text-white">{appt.token}</p>
                      <p className="text-[10px] text-gray-500">{appt.tokenType}</p>
                    </div>

                    <div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded ${getStatusClasses(
                          appt.queueStatus
                        )}`}
                      >
                        {getStatusLabel(appt.queueStatus)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}