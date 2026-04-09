"use client";

import React, { useEffect, useState } from "react";
import {
  getDoctorMonthlyAttendance,
  requestLeave,
  cancelLeave,
  getMyLeaves
} from "@/app/shared/api/doctor.api";

interface AttendanceDay {
  date: string;
  status: "worked" | "leave" | "absent";
}

interface LeaveRequest {
  _id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
}

export default function AttendancePage() {
  const today = new Date();

  const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);

  const [leaveModal, setLeaveModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [requesting, setRequesting] = useState(false);

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await getDoctorMonthlyAttendance(month, year);
      setAttendance(res?.days || []);
    } catch {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await getMyLeaves();
      setLeaves(res.leaves || []);
    } catch {}
  };

  useEffect(() => {
    fetchAttendance();
    fetchLeaves();
  }, [month, year]);

  const handleRequestLeave = async () => {
    if (!fromDate || !toDate) return alert("Select From and To dates");
    setRequesting(true);
    try {
      await requestLeave({ fromDate, toDate, reason });
      setFromDate("");
      setToDate("");
      setReason("");
      setLeaveModal(false);
      fetchAttendance();
      fetchLeaves();
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!window.confirm("Cancel this leave?")) return;
    try{
      const res =   await cancelLeave(id);
    fetchAttendance();
    fetchLeaves();
    alert(res.message || "Leave Cancelled Successfully")
    }catch(err: any){
       if (err.response && err.response.data) {
        alert(err.response.data.message || "Something went wrong");
        } else {
        alert(err.message || "Something went wrong");
        }
    }
    
  };

  const getDaysInMonth = (m: number, y: number) =>
    new Date(y, m, 0).getDate();

  const calendar = Array.from(
    { length: getDaysInMonth(month, year) },
    (_, i) => {
      const date = new Date(year, month - 1, i + 1);
      const day = attendance.find(
        (a) =>
          new Date(a.date).toDateString() === date.toDateString()
      );
      return { date, status: day?.status || "worked" };
    }
  );

  const getColor = (status: string) => {
    if (status === "worked")
      return "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
    if (status === "leave")
      return "bg-amber-400/20 border-amber-400/50 text-amber-300";
    return "bg-gray-800 border-gray-700 text-gray-500";
  };

  const isToday = (date: Date) =>
    date.toDateString() === new Date().toDateString();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const getStatusStyle = (status: string) => {
    if (status === "approved")
      return "bg-emerald-500/90 text-white";
    if (status === "pending")
      return "bg-yellow-400 text-gray-900";
    if (status === "rejected")
      return "bg-red-500 text-white";
    return "bg-gray-700 text-white";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Attendance & Leaves</h1>
          <button
            onClick={() => setLeaveModal(true)}
            className="px-5 py-2.5 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-400 transition"
          >
            Request Leave
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">

          {/* Calendar */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(
                    (m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    )
                  )}
                </select>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="px-3 py-2 w-24 bg-gray-800 border border-gray-700 rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2 text-xs text-gray-500 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendar.map((d, i) => (
                  <div
                    key={i}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium border transition
                      ${getColor(d.status)}
                      ${isToday(d.date) ? "ring-2 ring-cyan-400" : ""}`}
                  >
                    {d.date.getDate()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leave Requests - Compact Card Style */}
<div className="col-span-12 lg:col-span-8 space-y-2">
  {leaves.length === 0 ? (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center text-gray-500 shadow-md">
      No leave requests found
    </div>
  ) : (
    <div className="space-y-2">
      {leaves.map((l) => (
        <div
          key={l._id}
          className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-md hover:shadow-lg transition"
        >
          {/* Dates & Reason */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 w-full text-xs">
            <div className="flex flex-col">
              <span className="text-gray-400">From</span>
              <span className="text-white font-medium">{formatDate(l.fromDate)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400">To</span>
              <span className="text-white font-medium">{formatDate(l.toDate)}</span>
            </div>
            <div className="flex-1 flex flex-col">
              <span className="text-gray-400">Reason</span>
              <span className="text-gray-300 truncate">{l.reason || "N/A"}</span>
            </div>
          </div>

          {/* Status & Action */}
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(l.status)}`}
            >
              {l.status}
            </span>
            {(l.status === "pending" || l.status === "approved") && (
              <button
                onClick={() => handleCancelLeave(l._id)}
                className="px-2 py-0.5 text-[10px] rounded bg-red-500 hover:bg-red-400 text-white transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        </div>
      </div>

      {/* Leave Modal */}
      {leaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-5">Request Leave</h2>
            <div className="flex flex-col gap-4">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-sm"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-sm"
              />
              <input
                type="text"
                placeholder="Reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setLeaveModal(false)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestLeave}
                  className="px-4 py-2 bg-cyan-500 text-gray-900 rounded-md text-sm font-semibold"
                >
                  {requesting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed bottom-6 right-6 bg-gray-900 border border-gray-800 px-4 py-2 rounded-md text-xs text-gray-400 shadow-md">
          Loading...
        </div>
      )}
    </div>
  );
}