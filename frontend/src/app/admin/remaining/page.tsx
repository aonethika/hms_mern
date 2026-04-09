"use client";

import { getRemainingAppointmentsAdmin } from '@/app/shared/api/appointments.api';
import React, { useEffect, useState } from 'react';

export default function Page() {
  const [appointments, setAppointments] = useState<any[]>([]);

  const fetchRemainingAppointments = async () => {
    const res = await getRemainingAppointmentsAdmin();
    
    console.log("reamining", res);
    
    setAppointments(res.appointments || []);
  };

  useEffect(() => {
    fetchRemainingAppointments();
  }, []);

  const groupedByDoctor = appointments.reduce((acc: any, curr: any) => {
    const doctorName = curr.doctorId?.name || "Unknown Doctor";

    if (!acc[doctorName]) acc[doctorName] = [];
    acc[doctorName].push(curr);

    return acc;
  }, {});

  const getStatusStyle = (status: string) => {
    if (status === "waiting")
      return "bg-yellow-900/40 text-yellow-300";
    if (status === "in_consultation")
      return "bg-blue-900/40 text-blue-300";
    return "bg-gray-700 text-gray-300";
  };

  return (
    <div className="p-6 bg-gray-950 min-h-screen text-gray-100">
      <h1 className="text-2xl font-semibold mb-6">Remaining Appointments</h1>

      {Object.keys(groupedByDoctor).length === 0 ? (
        <div className="text-gray-400">No remaining appointments</div>
      ) : (
        Object.entries(groupedByDoctor).map(([doctor, list]: any) => (
          <div
            key={doctor}
            className="bg-gray-800 rounded-xl shadow-md border border-gray-700 mb-6"
          >
            {/* Doctor Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">{doctor}</h2>
              <span className="text-sm text-gray-400">
                {list.length} patients
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-400">
                  <tr>
                    <th className="px-5 py-3 text-left">Token</th>
                    <th className="px-5 py-3 text-left">Patient</th>
                    <th className="px-5 py-3 text-left">Phone</th>
                    <th className="px-5 py-3 text-left">Department</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {list.map((a: any) => (
                    <tr
                      key={a._id}
                      className="border-t border-gray-700 hover:bg-gray-700/40 transition"
                    >
                      <td className="px-5 py-3 font-medium text-white">
                        {a.token}
                      </td>

                      <td className="px-5 py-3 text-gray-200">
                        {a.patient?.name}
                      </td>

                      <td className="px-5 py-3 text-gray-400">
                        {a.patient?.phone}
                      </td>

                      <td className="px-5 py-3 text-gray-400">
                        {a.departmentId?.name}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            a.queueStatus
                          )}`}
                        >
                          {a.queueStatus.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}