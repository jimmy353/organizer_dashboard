"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ========================= */
/* Animated Counter */
/* ========================= */

function Counter({ value, prefix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        start = value;
        clearInterval(timer);
      }
      setCount(Math.floor(start));
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
    </span>
  );
}

/* ========================= */
/* MAIN DASHBOARD */
/* ========================= */

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access");

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/orders/organizer/dashboard/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-gray-400 text-sm md:text-base">
        Loading dashboard...
      </div>
    );

  const chartData = stats.monthly_revenue || [];

  return (
    <div className="relative min-h-screen bg-[#0b1220] text-white overflow-hidden">

      {/* Background glow */}
      <div className="absolute -top-40 -left-40 w-[500px] md:w-[600px] h-[500px] md:h-[600px] bg-emerald-500/20 blur-[150px] md:blur-[180px] rounded-full"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] md:w-[600px] h-[500px] md:h-[600px] bg-green-400/10 blur-[160px] md:blur-[200px] rounded-full"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-20">

        {/* HEADER */}
        <div className="mb-10 md:mb-16 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Executive Dashboard
            </h1>
            <p className="text-gray-400 mt-2 md:mt-3 text-sm md:text-lg">
              Financial performance overview
            </p>
          </div>

          <div className="text-emerald-400 text-xs md:text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
            System Online
          </div>
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-14 md:mb-20">

          <KPI title="Total Events">
            <Counter value={stats.total_events || 0} />
          </KPI>

          <KPI title="Total Orders">
            <Counter value={stats.total_orders || 0} />
          </KPI>

          <KPI title="Total Revenue" highlight>
            <Counter value={stats.total_revenue || 0} prefix="SSP " />
            <GrowthBadge />
          </KPI>

          <KPI title="Net Earnings">
            <Counter value={stats.total_organizer_earnings || 0} prefix="SSP " />
          </KPI>

        </div>

        {/* CHART SECTION */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.6)] mb-14 md:mb-20 transition">

          <h2 className="text-sm md:text-lg text-gray-300 mb-6 md:mb-10">
            Revenue Growth
          </h2>

          <ResponsiveContainer width="100%" height={250} className="md:h-[320px]">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>

        </div>

        {/* WALLET */}
        <div className="relative bg-gradient-to-br from-emerald-500/30 to-green-600/10
                        border border-emerald-400/30
                        rounded-2xl md:rounded-3xl
                        p-8 md:p-16
                        backdrop-blur-xl
                        shadow-[0_20px_80px_rgba(16,185,129,0.25)]
                        overflow-hidden">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)]"></div>

          <p className="text-xs md:text-sm uppercase tracking-widest text-gray-300 relative">
            Available Wallet Balance
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-400 mt-4 md:mt-6 relative">
            <Counter
              value={stats.total_organizer_earnings || 0}
              prefix="SSP "
            />
          </h2>

        </div>

      </div>
    </div>
  );
}

/* ========================= */
/* KPI CARD */
/* ========================= */

function KPI({ title, children, highlight }) {
  return (
    <div
      className={`relative rounded-2xl md:rounded-3xl p-6 md:p-10 transition-all duration-300
        ${
          highlight
            ? "bg-gradient-to-br from-emerald-400 to-green-500 text-black shadow-[0_20px_60px_rgba(16,185,129,0.4)]"
            : "bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg"
        }`}
    >
      <p className={`text-xs md:text-sm uppercase tracking-wide mb-4 md:mb-6 ${
        highlight ? "text-black/70" : "text-gray-400"
      }`}>
        {title}
      </p>

      <div className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
        {children}
      </div>
    </div>
  );
}

/* ========================= */
/* Growth Badge */
/* ========================= */

function GrowthBadge() {
  return (
    <div className="mt-3 inline-block text-[10px] md:text-xs px-3 py-1 rounded-full bg-black/20 text-black font-medium shadow">
      +12% Growth
    </div>
  );
}