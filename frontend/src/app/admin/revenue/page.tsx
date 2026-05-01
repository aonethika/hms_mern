"use client";

import { useEffect, useState } from "react";
import {
  getDailyRevenueApi,
  getMonthlyRevenueApi,
  getYearlyRevenueApi,
} from "@/app/shared/api/admin.api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------------- TYPES ----------------
type ChartItem = {
  day?: number;
  month?: string;
  revenue: number;
  medicines?: number;
  doctorFee?: number;
};

type RevenueData = {
  totalRevenue?: number;
  totalMedicines?: number;
  totalDoctorFee?: number;
  chart?: ChartItem[];
};

// ---------------- COMPONENT ----------------
export default function RevenuePage() {
  const [view, setView] = useState<"daily" | "monthly" | "yearly">("daily");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [daily, setDaily] = useState<RevenueData>({});
  const [monthly, setMonthly] = useState<RevenueData>({});
  const [yearly, setYearly] = useState<RevenueData>({});

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ---------------- SAFE CHARTS ----------------
  const monthlyChart: ChartItem[] = Array.isArray(monthly?.chart)
    ? monthly.chart
    : [];

  const yearlyChart: ChartItem[] = Array.isArray(yearly?.chart)
    ? yearly.chart
    : [];

  // ---------------- FETCH ----------------
  const fetchData = async () => {
    try {
      setLoading(true);

      if (view === "daily") {
        const res = await getDailyRevenueApi(date);
        setDaily(res?.data || {});
      }

      if (view === "monthly") {
        const res = await getMonthlyRevenueApi(month, year);
        setMonthly(res?.data || {});
      }

      if (view === "yearly") {
        const res = await getYearlyRevenueApi(year);
        setYearly(res || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [view, date, month, year]);

  // ---------------- CARD ----------------
  const Card = ({ title, value }: any) => (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-xl font-semibold text-cyan-400">
        ₹{value || 0}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-950 text-white min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-950 min-h-screen text-white space-y-10">

      {/* ================= VIEW ================= */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("daily")}
          className={`px-3 py-1 rounded ${
            view === "daily" ? "bg-cyan-500 text-black" : "bg-gray-800"
          }`}
        >
          Daily
        </button>

        <button
          onClick={() => setView("monthly")}
          className={`px-3 py-1 rounded ${
            view === "monthly" ? "bg-cyan-500 text-black" : "bg-gray-800"
          }`}
        >
          Monthly
        </button>

        <button
          onClick={() => setView("yearly")}
          className={`px-3 py-1 rounded ${
            view === "yearly" ? "bg-cyan-500 text-black" : "bg-gray-800"
          }`}
        >
          Yearly
        </button>
      </div>

      {/* ================= DAILY ================= */}
      {view === "daily" && (
        <div>
          <h1 className="text-2xl text-cyan-400 mb-4">Daily Revenue</h1>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-black border border-gray-700 px-3 py-2 rounded mb-4"
          />

          <div className="grid grid-cols-3 gap-4">
            <Card title="Total Revenue" value={daily?.totalRevenue} />
            <Card title="Medicine" value={daily?.totalMedicines} />
            <Card title="Doctor Fee" value={daily?.totalDoctorFee} />
          </div>
        </div>
      )}

      {/* ================= MONTHLY ================= */}
      {view === "monthly" && (
        <div>
          <h1 className="text-2xl text-cyan-400 mb-4">Monthly Revenue</h1>

          <div className="flex gap-3 mb-4">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-black border border-gray-700 px-3 py-2 rounded"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-black border border-gray-700 px-3 py-2 rounded w-28"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card title="Total Revenue" value={monthly?.totalRevenue} />
            <Card title="Medicine Revenue" value={monthly?.totalMedicines} />
            <Card title="Doctor Fee" value={monthly?.totalDoctorFee} />
          </div>

          {mounted && monthlyChart.length > 0 && (
            <div className="w-full h-[300px] bg-gray-900 p-4 rounded-xl">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChart}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ================= YEARLY ================= */}
      {view === "yearly" && (
        <div>
          <h1 className="text-2xl text-cyan-400 mb-4">Yearly Revenue</h1>

          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-black border border-gray-700 px-3 py-2 rounded w-28 mb-4"
          />

          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card title="Total Revenue" value={yearly?.totalRevenue} />
            <Card title="Medicine Revenue" value={yearly?.totalMedicines} />
            <Card title="Doctor Fee" value={yearly?.totalDoctorFee} />
          </div>

          {mounted && yearlyChart.length > 0 && (
            <div className="w-full h-[300px] bg-gray-900 p-4 rounded-xl">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyChart}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#22d3ee" />
                </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}