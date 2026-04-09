"use client";

import { getAllDoctorLeaves, approveLeaveApi, rejectLeaveApi } from "@/app/shared/api/admin.api";
import React, { useEffect, useState } from "react";

export default function Page() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await getAllDoctorLeaves();
      if (res?.success) setLeaves(res.leaves);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve this leave?")) return;
    setActionLoading(true);
    try {
      await approveLeaveApi(id);
      await fetchLeaves();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject this leave?")) return;
    const input = window.prompt("Rejection reason (optional)");
    if (input === null) return;
    const reason = input.trim() || "NA";
    setActionLoading(true);
    try {
      await rejectLeaveApi(id, reason);
      await fetchLeaves();
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLeaves = leaves.filter(l =>
    filter === "all" ? true : l.status === filter
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "approved": return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "cancelled": return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
      default: return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-8 relative">
      <h1 className="text-3xl font-semibold mb-6">Doctor Leaves</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["pending", "approved", "rejected", "cancelled", "all"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? "bg-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/20"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-gray-800 rounded-2xl bg-gray-900/60 backdrop-blur">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-900/80 text-gray-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 text-left">Doctor</th>
              <th className="p-4 text-left">From</th>
              <th className="p-4 text-left">To</th>
              <th className="p-4 text-left">Reason</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No leaves found
                </td>
              </tr>
            )}
            {filteredLeaves.map((l) => (
              <tr
                key={l._id}
                className="border-t border-gray-800 hover:bg-gray-800/50 transition"
              >
                <td className="p-4 font-medium">{l.doctorId?.name}</td>
                <td className="p-4 text-gray-400">{formatDate(l.fromDate)}</td>
                <td className="p-4 text-gray-400">{formatDate(l.toDate)}</td>
                <td className="p-4 text-gray-300 max-w-xs truncate">{l.reason || "N/A"}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(l.status)}`}>
                    {l.status}
                  </span>
                </td>
                <td className="p-4">
                  {l.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(l._id)}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-gray-950 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(l._id)}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-gray-950 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(loading || actionLoading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 px-6 py-4 rounded-lg shadow-lg text-white text-sm">
            {actionLoading ? "Processing..." : "Loading..."}
          </div>
        </div>
      )}
    </div>
  );
}