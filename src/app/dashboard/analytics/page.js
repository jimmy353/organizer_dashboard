"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  ResponsiveContainer
} from "recharts";

export default function AnalyticsPage() {

  const [data, setData] = useState(null);
  const [range, setRange] = useState("all");

  useEffect(() => {
  async function fetchAnalytics() {
    const token = localStorage.getItem("access");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/orders/organizer/advanced-analytics/?range=${range}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const json = await res.json();
    setData(json);
  }

  fetchAnalytics();
}, [range]);

  async function fetchAnalytics() {
    const token = localStorage.getItem("access");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/organizer/advanced-analytics/?range=${range}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load analytics");
      }

      const json = await res.json();
      setData(json);

    } catch (err) {
      console.error("Analytics error:", err);
    }
  }

  function formatSSP(value) {
    return `SSP ${Number(value || 0).toLocaleString()}`;
  }

  function exportCSV() {
    const rows = [
      ["Total Revenue", data.total_revenue],
      ["Total Orders", data.total_orders],
      ["Commission", data.total_commission],
      ["Your Earnings", data.total_organizer_earnings],
    ];

    let csv = "Metric,Value\n";
    rows.forEach(r => {
      csv += r.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics.csv";
    a.click();
  }

  if (!data)
    return (
      <div className="min-h-screen bg-[#0b1120] text-white flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b1120] text-white px-4 py-6 sm:p-10">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold break-words">📊 Analytics Dashboard</h1>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-full sm:w-auto bg-[#1f2937] px-4 py-2 rounded-xl"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="12m">Last 12 Months</option>
          </select>

          <button
            onClick={exportCSV}
            className="w-full sm:w-auto bg-green-500 px-4 py-2 rounded-xl"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
        <Card title="Total Revenue" value={formatSSP(data.total_revenue)} />
        <Card title="Total Orders" value={data.total_orders || 0} />
        <Card title="Commission" value={formatSSP(data.total_commission)} />
        <Card title="Your Earnings" value={formatSSP(data.total_organizer_earnings)} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">

        <GlassCard title="Monthly Revenue">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.monthly_revenue || []}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#22c55e"
                fill="#22c55e"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="Orders Timeline">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.orders_timeline || []}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar
                dataKey="orders"
                fill="#3b82f6"
                radius={[12,12,0,0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="Top Events">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.top_events || []}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="event" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#facc15"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="AI Prediction">
          <div className="text-3xl font-bold text-green-400">
            {formatSSP(data.predicted_next_month)}
          </div>
          <p className="text-gray-400 mt-2">
            Estimated revenue for next month
          </p>
        </GlassCard>

      </div>

    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="p-4 sm:p-8 rounded-3xl bg-gradient-to-br from-[#111827] to-[#1f2937] border border-[#1e293b] shadow-2xl">
      <p className="text-gray-400">{title}</p>
      <h2 className="text-3xl font-bold mt-4">{value}</h2>
    </div>
  );
}

function GlassCard({ title, children }) {
  return (
    <div className="p-5 sm:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
      <h2 className="text-2xl sm:text-3xl font-bold mt-4">{title}</h2>
      {children}
    </div>
  );
}