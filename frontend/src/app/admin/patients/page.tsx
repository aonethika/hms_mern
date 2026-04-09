"use client";
import { getAllPatients } from "@/app/shared/api/admin.api";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function Page() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState(""); // state for search input
  const router = useRouter();

  const fetchPatients = async () => {
    const res = await getAllPatients();
    if (res?.success) {
      setPatients(res.patients);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Filter patients based on name or phone
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-xl font-semibold mb-4">Patients</h1>

      <input
        type="text"
        placeholder="Search by name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 p-2 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-cyan-400"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((p: any) => (
          <div
            onClick={() => router.push(`/admin/patients/${p._id}`)}
            key={p._id}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:border-cyan-400 transition"
          >
            <div className="text-lg font-semibold text-cyan-400">{p.name}</div>
            <div className="text-sm text-gray-400">{p.phone}</div>
            <div className="text-sm">
              <span className="text-gray-500">Gender: </span>
              <span>{p.gender}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Blood: </span>
              <span>{p?.bloodGroup}</span>
            </div>
          </div>
        ))}

        {filteredPatients.length === 0 && (
          <div className="text-gray-500 text-center mt-4">
            No patients found.
          </div>
        )}
      </div>
    </div>
  );
}