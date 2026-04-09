"use client";

import { getMyPatientHistory, getPatientByAppointmentId, } from "@/app/shared/api/doctor.api";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Patient {
  _id: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
}

interface Prescription {
  _id: string;
  diagnosis: string;
  advice: string;
  medicines: any[];
  createdAt: string;
  patientId: Patient;
  doctorId: {
    _id: string;
    name: string;
  };
  followUpDate: string;
  followup: boolean;
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<Prescription[]>([]);

  const fetchPatient = async () => {
    try {
      const res = await getPatientByAppointmentId(appointmentId);
      setPatient(res.patient);
      if (res.patient?._id) {
        const historyRes = await getMyPatientHistory(res.patient._id);
        setHistory(historyRes.prescriptions || []);
      }
    } catch (err) {
      console.error("Error fetching patient or history:", err);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, []);
console.log(history);

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex flex-col items-center font-sans">
      {patient ? (
        <div className="w-full flex flex-col items-center space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md p-6 w-96 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">{patient.name}</h2>
            <p className="text-white text-md mb-1"><span className="font-semibold">Gender:</span> {patient.gender}</p>
            <p className="text-white text-md mb-1"><span className="font-semibold">Phone:</span> {patient.phone}</p>
          </div>

          <button
            onClick={() => router.push(`/doctor/create-prescription/${appointmentId}`)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-medium shadow w-80 transition-all duration-200"
          >
            Create Prescription
          </button>

          <div className="w-full max-w-4xl mt-6">
            <h3 className="text-2xl font-semibold text-white mb-4 text-center border-b border-gray-700 pb-2">
              Medical History
            </h3>
            {history.length > 0 ? (
              <div className="space-y-3 flex flex-col w-full">
                {history.map((presc) => (
                  <div
                    key={presc._id}
                    className="bg-gray-950 border cursor-pointer transition transform hover:-translate-y-1 border-gray-700 rounded-xl shadow-sm p-4 w-full hover:shadow-md transition-shadow"
                    onClick={()=> router.push( `/doctor/prescription/${presc._id}`)}
                  >
                    <div className="flex justify-between text-xs  items-start text-white text-md">
                      <div className="flex-1 pr-4">
                        <p className="mb-1"><span className="font-semibold">Consulted By:</span> Dr. {presc.doctorId?.name}</p>
                        <p className="mb-1"><span className="font-semibold">Diagnosis:</span> {presc.diagnosis || "NA"}</p>
                        <p className="mb-1"><span className="font-semibold">Meedicines:</span> {presc.medicines.map((m) => m.name).join(", ") || "Na"}</p>
                        {presc.followUpDate &&(
                          <p className="mb-1"><span className="font-semibold">Follow-up on:</span> {new Date(presc.followUpDate).toLocaleDateString()}</p>
                       
                        )}
                      </div>
                      <div className="text-sm text-gray-300 flex-shrink-0">
                        {new Date(presc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center mt-6">No prescriptions found</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-400 mt-20">Loading patient details...</p>
      )}
    </div>
  );
}
               
                    