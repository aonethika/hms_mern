"use client";

import { getMyPatients } from "@/app/shared/api/doctor.api";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Patient {
  _id: string;
  name: string;
  phone: string;
  gender: string;
  dob: string;
}

export default function Page() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");

  const fetchPatients = async () => {
    const res = await getMyPatients();
    if (res.success) setPatients(res.patients || []);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  console.log(patients);
  

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
    );
  }, [patients, search]);

  return (
    <div className="p-8 bg-gray-950 min-h-screen">
      <h1 className="text-3xl text-white font-semibold mb-6 text-center">
        My Patients
      </h1>
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 rounded-lg border border-cyan-700 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredPatients.length === 0 ? (
          <p className="text-white col-span-full text-center">
            No patients found
          </p>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient._id}
              onClick={() => router.push(`/doctor/patient-history/${patient._id}`)}
              className="cursor-pointer bg-gray-900 hover:bg-cyan-800 transition transform hover:-translate-y-1 hover:shadow-xl rounded-xl p-5 flex flex-col justify-between h-44 border border-cyan-700"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-cyan-700 font-bold text-lg">
                  {patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <h2 className="text-white font-semibold text-lg">{patient.name}</h2>
              </div>
              <div className="mt-3 text-white text-sm space-y-1">
                <p>Phone: {patient.phone}</p>
                <p>Gender: {patient.gender}</p>
                <p>DOB: {new Date(patient.dob).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}