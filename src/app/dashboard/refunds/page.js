"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ================= API HELPER ================= */

async function apiFetch(path, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  return { res, data };
}

/* ================= HELPERS ================= */

function money(n) {
  return Number(n || 0).toFixed(2);
}

function formatDate(date) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleString();
}

function badgeClass(status) {
  const s = (status || "").toLowerCase();

  if (s.includes("approved") || s === "approved") return "bg-yellow-500 text-black";
  if (s.includes("refunded") || s === "refunded") return "bg-green-500 text-black";
  if (s.includes("rejected") || s === "rejected") return "bg-red-500 text-black";
  if (s.includes("pending") || s === "pending") return "bg-zinc-700 text-white";

  return "bg-zinc-700 text-white";
}

/* ======================================================== */

export default function RefundsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [refunds, setRefunds] = useState([]);
  const [selectedRefund, setSelectedRefund] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) fetchRefunds(selectedEvent.id);
  }, [selectedEvent]);

  async function fetchEvents() {
    setLoading(true);
    setError("");

    const { res, data } = await apiFetch("/api/events/organizer/");

    if (res.ok) {
      setEvents(data || []);
      if ((data || []).length > 0) setSelectedEvent(data[0]);
    } else {
      setError("Failed to load events.");
    }

    setLoading(false);
  }

  async function fetchRefunds(eventId) {
    setLoading(true);
    setError("");

    // ✅ If your backend route differs, change only this path:
    const { res, data } = await apiFetch(`/api/refunds/organizer/?event=${eventId}`);

    if (res.ok) setRefunds(data || []);
    else setError(data?.error || "Failed to load refunds.");

    setLoading(false);
  }

  /* ================= SUMMARY ================= */

  const totals = useMemo(() => {
    const totalCount = refunds.length;

    const pending = refunds.filter((r) => (r.status || "").toLowerCase() === "pending").length;
    const approved = refunds.filter((r) => (r.status || "").toLowerCase() === "approved").length;
    const refunded = refunds.filter((r) => (r.status || "").toLowerCase() === "refunded").length;
    const rejected = refunds.filter((r) => (r.status || "").toLowerCase() === "rejected").length;

    const totalAmount = refunds.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    return { totalCount, pending, approved, refunded, rejected, totalAmount };
  }, [refunds]);

  /* ================= CSV EXPORT ================= */

  function exportCSV() {
    const headers = [
      "Refund ID",
      "Order ID",
      "Amount",
      "Status",
      "Reason",
      "Customer",
      "Event",
      "Requested At",
      "Approved At",
      "Refunded At",
    ];

    const rows = refunds.map((r) => [
      r.id,
      r.order_id,
      r.amount,
      r.status,
      (r.reason || "").replaceAll(",", " "),
      r.customer_email,
      r.event_title,
      formatDate(r.created_at || r.requested_at),
      formatDate(r.approved_at),
      formatDate(r.refunded_at),
    ]);

    const csv = headers.join(",") + "\n" + rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "refunds.csv";
    a.click();
  }

  /* ======================================================== */

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Refunds</h1>
            <p className="text-sm text-zinc-400">
              Refund requests are accepted up to <b>24 hours</b> before the event, and processing may take <b>3–7 days</b> in MoMo.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="bg-white/10 px-5 py-3 rounded-xl hover:bg-white/20"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* EVENT SELECT */}
        <div className="mt-6">
          <select
            value={selectedEvent?.id || ""}
            onChange={(e) =>
              setSelectedEvent(events.find((ev) => ev.id === Number(e.target.value)))
            }
            className="w-full md:w-1/3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mt-6 grid md:grid-cols-5 gap-4">
          <Stat label="Total Refunds" value={`${totals.totalCount}`} />
          <Stat label="Pending" value={`${totals.pending}`} yellow />
          <Stat label="Approved" value={`${totals.approved}`} blue />
          <Stat label="Refunded" value={`${totals.refunded}`} green />
          <Stat label="Total Amount" value={`SSP ${money(totals.totalAmount)}`} />
        </div>

        {/* LIST */}
        <div className="mt-8">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/40 p-4 rounded-xl text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-zinc-500">Loading refunds...</div>
          ) : (
            <div className="border border-zinc-800 rounded-2xl overflow-hidden">
              {refunds.length === 0 ? (
                <div className="p-6 text-zinc-500">No refunds for this event yet.</div>
              ) : (
                refunds.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRefund(r)}
                    className="grid grid-cols-6 items-center px-6 py-4 border-b border-zinc-800 hover:bg-white/5 cursor-pointer"
                  >
                    <div className="font-bold">SSP {money(r.amount)}</div>
                    <div className="text-sm text-zinc-300">Order #{r.order_id}</div>
                    <div className="text-sm">{r.customer_email}</div>
                    <div className="text-sm">{formatDate(r.created_at || r.requested_at)}</div>
                    <div className="text-sm text-zinc-400 truncate">{r.reason || "—"}</div>

                    <div className="flex justify-end">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${badgeClass(r.status)}`}>
                        {r.status || "pending"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* MODAL */}
        {selectedRefund && (
          <RefundModal refund={selectedRefund} onClose={() => setSelectedRefund(null)} />
        )}
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Stat({ label, value, green, yellow, blue }) {
  const color = green
    ? "text-green-400"
    : yellow
    ? "text-yellow-400"
    : blue
    ? "text-sky-400"
    : "text-white";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`mt-2 text-2xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

function RefundModal({ refund, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold mb-4">Refund Details</h2>

        <Detail label="Amount" value={`SSP ${money(refund.amount)}`} />
        <Detail label="Order" value={`#${refund.order_id}`} />
        <Detail label="Customer" value={refund.customer_email} />
        <Detail label="Event" value={refund.event_title} />
        <Detail label="Status" value={refund.status} />
        <Detail label="Reason" value={refund.reason || "—"} />
        <Detail label="Requested At" value={formatDate(refund.created_at || refund.requested_at)} />
        <Detail label="Approved At" value={formatDate(refund.approved_at)} />
        <Detail label="Refunded At" value={formatDate(refund.refunded_at)} />

        <div className="mt-4 text-xs text-zinc-400">
          MoMo refunds may take <b>3–7 days</b> depending on provider processing.
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-green-500 text-black font-bold py-3 rounded-xl"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between text-sm mb-2 gap-4">
      <div className="text-zinc-400">{label}</div>
      <div className="font-bold text-right break-words">{value}</div>
    </div>
  );
}