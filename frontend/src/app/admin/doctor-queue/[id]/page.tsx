"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDoctorTodayQueueApi } from "@/app/shared/api/admin.api";
import { Rss } from "lucide-react";

export default function DoctorQueuePage() {
  const params = useParams();
  const doctorId = params.id as string;

  const [current, setCurrent] = useState<any>(null);
  const [waiting, setWaiting] = useState<any[]>([]);

  useEffect(() => {
    const fetchQueue = async () => {
      const res = await getDoctorTodayQueueApi(doctorId);
      console.log(res);
      
      setCurrent(res.inConsultation || null);
      setWaiting(res.waiting || []);
    };

    fetchQueue();
  }, [doctorId]);

  return (
    <div className="w-full min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto bg-gray-850 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        
        <div className="px-6 py-5 border-b border-gray-800">
          <h1 className="text-xl font-semibold text-white">Doctor Queue</h1>
        </div>

        <div className="p-6 border-b border-gray-800">
          <h2 className="text-sm uppercase text-gray-400 mb-3">Current Patient</h2>
          {current ? (
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl">
              <div>
                <div className="text-white font-medium">
                  {current.patient?.name}
                </div>
                <div className="text-xs text-gray-400">
                  Token: {current.token}
                </div>
              </div>
              <span className="text-green-400 text-sm">In Consultation</span>
            </div>
          ) : (
            <div className="text-gray-500 italic">No active patient</div>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-sm uppercase text-gray-400 mb-4">Waiting Patients</h2>

          <div className="grid grid-cols-2 bg-gray-800 px-6 py-3 text-xs uppercase tracking-wide text-gray-400 font-semibold rounded-t-xl">
            <div>Patient</div>
            <div>Token</div>
          </div>

          {waiting.map((p) => (
            <div
              key={p.token}
              className="grid grid-cols-2 px-6 py-4 border-t border-gray-800"
            >
              <div className="text-white">{p.patient?.name}</div>
              <div className="text-yellow-400 text-sm">{p.token}</div>
            </div>
          ))}

          {waiting.length === 0 && (
            <div className="text-center text-gray-500 py-6">
              No waiting patients
            </div>
          )}
        </div>
      </div>
    </div>
  );
}