"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPrescriptionById } from "@/app/shared/api/doctor.api";

const calculateAge = (dob?: string) => {
  if (!dob) return "NA";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

export default function Page() {
  const params = useParams();
  const prescriptionId = params.id as string;

  const [prescription, setPrescription] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await getPrescriptionById(prescriptionId);
        setPrescription(res.prescription);
        setPatient(res.prescription.patientId);
        setDoctor(res.prescription.doctorId);
      } catch {}
      finally { setLoading(false); }
    };
    fetchPrescription();
  }, [prescriptionId]);

  if (loading) return <div className="text-center mt-10 text-gray-400">Loading...</div>;
  if (!prescription) return <div className="text-center mt-10 text-red-500">Prescription not found</div>;

  return (
    <div className="flex justify-center mt-5">
      <div className="bg-white max-w-xl w-full rounded-xl shadow-lg  text-sm overflow-hidden min-h-[500px]">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start bg-cyan-600 text-white px-4 py-3 rounded-t-xl">
            <h1 className="text-lg font-bold">Nalanda Hospital</h1>
            <div className="text-right">
              <h2 className="text-sm font-semibold underline">{doctor?.name || "Dr. Name"}</h2>
              <p className="text-xs text-gray-200">{doctor?.qualification?.join(", ") || "MBBS"}</p>
              {doctor?.specialization && <p className="text-xs text-gray-200">{doctor.specialization}</p>}
            </div>
          </div>
          <div className="px-5 py-2 border-b border-gray-300 text-sm flex flex-wrap justify-between gap-2 text-black">
            <span><span className="font-semibold">Name:</span> {patient?.name || "—"}</span>
            <span><span className="font-semibold">Age:</span> {calculateAge(patient?.dob)}</span>
            <span><span className="font-semibold">Gender:</span> {patient?.gender || "—"}</span>
          </div>
          <h2 className="text-center text-sm font-semibold text-black my-2 tracking-widest">PRESCRIPTION</h2>
          <div className="px-5 mb-2">
            <p className="text-xs font-semibold text-black uppercase mb-1">Diagnosis</p>
            <p className="text-black min-h-[14px]">{prescription.diagnosis || "—"}</p>
          </div>
          <div className="text-lg font-bold text-cyan-900 px-5 mb-2">℞</div>
          <div className="px-5 mb-2">
            <div className="overflow-hidden rounded border border-gray-300">
              <table className="w-full text-xs">
                <thead className="bg-cyan-400 text-black">
                  <tr className="text-left">
                    <th className="px-2 py-1 w-2/5">Name</th>
                    <th className="px-2 py-1 w-1/5">Dosage</th>
                    <th className="px-2 py-1 w-1/5">Frequency</th>
                    <th className="px-2 py-1 w-1/5">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {prescription.medicines?.map((med: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-2 py-1 font-medium text-black">{med.name || "—"}</td>
                      <td className="px-2 py-1 text-gray-700">{med.dosage || "—"}</td>
                      <td className="px-2 py-1 text-gray-700">{med.frequency || "—"}</td>
                      <td className="px-2 py-1 text-gray-700">{med.duration || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="px-5 mb-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Notes</p>
            <p className="text-gray-700 min-h-[14px]">{prescription.notes || "—"}</p>
          </div>
          <div className="px-5 mb-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Advice</p>
            <p className="text-gray-700 min-h-[14px]">{prescription.advice || "—"}</p>
          </div>
          {prescription.followUpDate && (
            <div className="px-5 py-2 text-xs flex justify-between border-t border-gray-300">
              <span className="font-semibold text-gray-500">Follow-up:</span>
              <span className="text-cyan-700 font-medium">{new Date(prescription.followUpDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}