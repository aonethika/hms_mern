"use client";

import { getPendingPrescriptionsApi } from "@/app/shared/api/pharmacy.api";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

export default function Page() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchPendingPrescription = async () => {
    try {
      const res = await getPendingPrescriptionsApi();
      setPrescriptions(res.prescriptions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingPrescription();
  }, []);

 
  const filteredPrescriptions = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return prescriptions;

    return prescriptions.filter((p: any) => {
      const name = p.patientId?.name?.toLowerCase() || "";
      const phone = p.patientId?.phone?.toLowerCase() || "";

      return name.includes(q) || phone.includes(q);
    });
  }, [search, prescriptions]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">

      <h1 className="text-xl font-semibold mb-4">
        Pending Prescriptions
      </h1>

      
      <input
        type="text"
        placeholder="Search patient name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md mb-4 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />

     {/* CARDS */}
{filteredPrescriptions.length > 0 ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

    {filteredPrescriptions.map((p: any) => (
      <div
        key={p._id}
        onClick={() => router.push(`/pharmacy/medicines/${p._id}`)}
        className="cursor-pointer bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-cyan-500 transition"
      >
        <p className="text-sm text-gray-400">Patient</p>
        <p className="text-lg font-semibold text-white">
          {p.patientId?.name || "Unknown Patient"}
        </p>

        <p className="text-xs text-gray-500">
          {p.patientId?.phone || "No phone"}
        </p>

        <p className="text-sm text-gray-400 mt-2">Doctor</p>
        <p className="text-md text-cyan-400">
          Dr. {p.doctorId?.name || "Unknown Doctor"}
        </p>

        <div className="mt-3 text-xs text-gray-500">
          Click to view medicines →
        </div>
      </div>
    ))}

  </div>
) : (
  <div className="flex items-center justify-center h-64">
  <p className="text-gray-400 text-center">
    No Prescriptions found
  </p>
</div>
)}
</div>
  );
}