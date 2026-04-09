"use client";

import { useEffect, useState } from "react";
import { getMyFollowups } from "@/app/shared/api/patient.api";
import useAuthStore from "@/app/shared/store/auth.store";

export default function FollowUpsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { selectedPatient } = useAuthStore();

  // Fetch follow-ups when patient is selected
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getMyFollowups(selectedPatient?._id);
        setData(res?.followUps || []);
      } catch {
        setData([]);
      }
      setLoading(false);
    };

    if (selectedPatient?._id) fetchData();
  }, [selectedPatient]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-6 md:px-8 py-8">
      {/* Page Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Follow Ups
      </h1>

      {/* Follow-ups list */}
      <div className="flex flex-col gap-6 max-w-xl mx-auto">
        {data.map((item) => (
          <div
            key={item._id}
            className="bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-cyan-500/10 transition"
          >
            {/* Doctor Name & Tag */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
              <p className="text-white font-semibold text-sm sm:text-base">
                Dr. {item?.doctorId?.name || "Unknown"}
              </p>
              <span className="mt-2 sm:mt-0 text-xs sm:text-sm bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">
                Follow-up
              </span>
            </div>

            {/* Specialization */}
            <p className="text-gray-400 text-sm mb-3">
              {item?.doctorId?.specialization || "General"}
            </p>

            {/* Notes */}
            <div className="bg-gray-900 rounded-lg p-3 mb-3">
              <p className="text-gray-300 text-sm sm:text-base">
                {item?.notes || "No notes available"}
              </p>
            </div>

            {/* Date & Appointment Status */}
            <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500">
              <span>
                {new Date(item.date).toLocaleDateString()}
              </span>

              {item?.appointmentId?.status && (
                <span className="capitalize text-cyan-400">
                  {item.appointmentId.status}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {!data.length && (
          <p className="text-gray-400 text-center mt-10 text-sm sm:text-base">
            No follow-ups found
          </p>
        )}
      </div>
    </div>
  );
}