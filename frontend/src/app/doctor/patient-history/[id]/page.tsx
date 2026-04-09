"use client";
import { getMyPatientHistory } from '@/app/shared/api/doctor.api';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

export default function Page() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const params = useParams();
  const patientId = params.id as string;

  const router = useRouter();

  const fetchPatientHistory = async () => {
    const res = await getMyPatientHistory(patientId);
    setPrescriptions(res.prescriptions || []);
  }

  useEffect(() => {
    fetchPatientHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Medical History</h1>
      <div className="flex flex-col gap-3 max-w-xl mx-auto">
        {prescriptions.map((p, idx) => (
          <div key={idx} className="flex bg-gray-800 cursor-pointer rounded-lg shadow p-3 gap-3 transition transform hover:-translate-y-1 hover:shadow-xl"
          onClick={()=> router.push(`/doctor/prescription/${p._id}`)}
          >
            <div className="w-0.5 bg-cyan-400 rounded-full"></div>
            <div className="flex-1 flex flex-col gap-1">
              <p className="text-sm text-gray-400">Consulted <span className="text-white font-semibold">Dr. {p?.doctorId?.name}</span></p>
              <p className="text-white text-base">{p.diagnosis}</p>
              {p.prescription && (
                <ul className="text-gray-300 text-sm list-disc list-inside mt-1">
                  {p.prescription.map((med: any, i: number) => (
                    <li key={i}>{med}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {prescriptions.length === 0 && (
          <p className="text-gray-400 text-center mt-10">No history found</p>
        )}
      </div>
    </div>
  );
}