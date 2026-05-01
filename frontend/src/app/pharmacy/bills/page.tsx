"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllBillsApi } from "@/app/shared/api/pharmacy.api";
import { useRouter } from "next/navigation";

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState<"all" | "paid" | "pending">("pending");
  const [search, setSearch] = useState("");

  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "1m" | "6m" | "1y" | "custom"
  >("1m");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const router = useRouter();

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await getAllBillsApi();
      setBills(res?.bills || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const getStatusColor = (status: string) => {
    if (status === "paid") return "text-green-400";
    if (status === "partial") return "text-yellow-400";
    return "text-red-400";
  };

  // 🔥 DATE LOGIC
  const getDateRange = () => {
    const now = new Date();

    if (dateFilter === "today") {
      return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
    }

    if (dateFilter === "1m") {
      return { start: new Date(new Date().setMonth(now.getMonth() - 1)), end: new Date() };
    }

    if (dateFilter === "6m") {
      return { start: new Date(new Date().setMonth(now.getMonth() - 6)), end: new Date() };
    }

    if (dateFilter === "1y") {
      return { start: new Date(new Date().setFullYear(now.getFullYear() - 1)), end: new Date() };
    }

    if (dateFilter === "custom" && fromDate && toDate) {
      return { start: new Date(fromDate), end: new Date(toDate) };
    }

    return null;
  };

  const filteredBills = useMemo(() => {
    const range = getDateRange();

    return bills.filter((b) => {
      const name = b.patient?.name?.toLowerCase() || "";
      const phone = b.patient?.phone || "";

      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        phone.includes(search);

      let matchesFilter = true;

      if (filter === "paid") {
        matchesFilter = b.paymentStatus === "paid";
      } else if (filter === "pending") {
        matchesFilter =
          b.paymentStatus === "pending" ||
          b.paymentStatus === "partial";
      }

      let matchesDate = true;
      if (range) {
        const billDate = new Date(b.billedAt);
        matchesDate =
          billDate >= range.start && billDate <= range.end;
      }

      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [bills, search, filter, dateFilter, fromDate, toDate]);

  if (loading) {
    return <div className="p-6 text-white bg-gray-950 min-h-screen">Loading...</div>;
  }

  const handlePrint = () => window.print();

  return (
    <div className="p-6 bg-gray-950 min-h-screen text-white">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">


        {/* DATE FILTER TOP RIGHT */}
        <div className="flex flex-col items-end gap-2">

          <div className="flex gap-2 flex-wrap justify-end">

            {[
              { label: "Today", value: "today" },
              { label: "Last 1 Month", value: "1m" },
              { label: "Last 6 Months", value: "6m" },
              { label: "Last 1Year", value: "1y" },
              { label: "Custom", value: "custom" },
              { label: "All", value: "all" },
            ].map((d) => (
              <button
                key={d.value}
                onClick={() => setDateFilter(d.value as any)}
                className={`px-2 py-1 text-xs rounded ${
                  dateFilter === d.value
                    ? "bg-cyan-500 text-black"
                    : "bg-gray-800"
                }`}
              >
                {d.label}
              </button>
            ))}

          </div>

          {/* CUSTOM DATE */}
          {dateFilter === "custom" && (
            <div className="flex gap-2 mt-1">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-black border border-gray-700 px-2 py-1 rounded text-sm"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-black border border-gray-700 px-2 py-1 rounded text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* SEARCH + STATUS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">

        <input
          type="text"
          placeholder="Search name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-black border border-gray-700 w-full sm:w-64"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded ${
              filter === "pending"
                ? "bg-yellow-300 text-black"
                : "bg-gray-800"
            }`}
          >
            Pending / Partial
          </button>

          <button
            onClick={() => setFilter("paid")}
            className={`px-3 py-1 rounded ${
              filter === "paid"
                ? "bg-green-500 text-black"
                : "bg-gray-800"
            }`}
          >
            Paid
          </button>

          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded ${
              filter === "all"
                ? "bg-cyan-500 text-black"
                : "bg-gray-800"
            }`}
          >
            All
          </button>

        </div>

        <button
          onClick={handlePrint}
          className="bg-cyan-600 px-4 py-2 rounded"
        >
          Print Table
        </button>
      </div>

      {/* COUNT */}
      <p className="mb-3 text-sm text-gray-400">
        Showing {filteredBills.length} of {bills.length}
      </p>
      

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-800 text-sm">

          <thead className="bg-gray-900">
            <tr>
              <th className="p-2 text-left">Patient</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Doctor</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Paid</th>
              <th className="p-2 text-left">Due</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredBills.map((b, i) => (
              <tr key={i} className="border-t border-gray-800 hover:bg-gray-900/40">

                <td className="p-2">{b.patient?.name}</td>
                <td className="p-2">{b.patient?.phone}</td>
                <td className="p-2">{b.doctor?.name}</td>

                <td className="p-2">₹{b.totalAmount}</td>
                <td className="p-2 text-green-400">₹{b.paidAmount}</td>
                <td className="p-2 text-red-400">₹{b.dueAmount}</td>

                <td className={`p-2 ${getStatusColor(b.paymentStatus)}`}>
                  {b.paymentStatus}
                </td>

                <td className="p-2">
                  {new Date(b.billedAt).toLocaleDateString()}
                </td>

                <td className="p-2">
                  <button
                    onClick={() =>
                      router.push(`/pharmacy/bills/${b.prescriptionId}`)
                    }
                    className="bg-cyan-600 px-3 py-1 rounded"
                  >
                    View
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>


       <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
            color: black !important;
          }

          table {
            width: 100%;
            font-size: 12px;
          }
        }
      `}</style>
      </div>
    </div>
  );
}