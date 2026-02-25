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
  if (!date) return "—";
  return new Date(date).toLocaleString();
}

function badgeClass(status) {
  const s = (status || "").toLowerCase();

  if (s === "requested") return "bg-yellow-500 text-black";
  if (s === "approved") return "bg-sky-500 text-black";
  if (s === "processing") return "bg-orange-500 text-black";
  if (s === "paid") return "bg-green-500 text-black";
  if (s === "rejected") return "bg-red-500 text-black";

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
    if (selectedEvent?.id) fetchRefunds(selectedEvent.id);
  }, [selectedEvent]);

  async function fetchEvents() {
    setLoading(true);
    setError("");

    const { res, data } = await apiFetch("/api/events/organizer/");

    if (res.ok) {
      const list = Array.isArray(data) ? data : [];
      setEvents(list);

      if (list.length > 0) {
        setSelectedEvent(list[0]);
      }
    } else {
      setError("Failed to load events.");
    }

    setLoading(false);
  }

  async function fetchRefunds(eventId) {
    setLoading(true);
    setError("");

    const { res, data } = await apiFetch(
      `/api/refunds/organizer/?event=${eventId}`
    );

    if (res.ok) {
      setRefunds(Array.isArray(data) ? data : []);
    } else {
      setError(data?.error || "Failed to load refunds.");
    }

    setLoading(false);
  }

  /* ================= SUMMARY ================= */

  const totals = useMemo(() => {
    const totalCount = refunds.length;

    const requested = refunds.filter(
      (r) => r.status?.toLowerCase() === "requested"
    ).length;

    const approved = refunds.filter(
      (r) => r.status?.toLowerCase() === "approved"
    ).length;

    const processing = refunds.filter(
      (r) => r.status?.toLowerCase() === "processing"
    ).length;

    const paid = refunds.filter(
      (r) => r.status?.toLowerCase() === "paid"
    ).length;

    const rejected = refunds.filter(
      (r) => r.status?.toLowerCase() === "rejected"
    ).length;

    const totalAmount = refunds.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );

    return {
      totalCount,
      requested,
      approved,
      processing,
      paid,
      rejected,
      totalAmount,
    };
  }, [refunds]);

  /* ================= CSV EXPORT ================= */

  function exportCSV() {
    if (!refunds.length) return;

    const headers = [
      "Reference",
      "Order ID",
      "Amount",
      "Status",
      "Customer",
      "Event",
      "Requested At",
      "Approved At",
      "Paid At",
    ];

    const rows = refunds.map((r) => [
      r.reference,
      r.order_id,
      r.amount,
      r.status,
      r.customer_email,
      r.event_title,
      formatDate(r.requested_at),
      formatDate(r.approved_at),
      formatDate(r.paid_at),
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.join(",")).join("\n");

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
        <div className="flex justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Refunds</h1>
            <p className="text-sm text-zinc-400">
              Refund requests are accepted up to <b>24 hours</b> before event.
              MoMo processing may take <b>3–7 days</b>.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="bg-white/10 px-5 py-3 rounded-xl hover:bg-white/20"
          >
            Export CSV
          </button>
        </div>

        {/* EVENT SELECT */}
        <div className="mt-6">
          <select
            value={selectedEvent?.id || ""}
            onChange={(e) =>
              setSelectedEvent(
                events.find((ev) => ev.id === Number(e.target.value))
              )
            }
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        {/* SUMMARY */}
        <div className="mt-6 grid md:grid-cols-6 gap-4">
          <Stat label="Total" value={totals.totalCount} />
          <Stat label="Requested" value={totals.requested} yellow />
          <Stat label="Approved" value={totals.approved} blue />
          <Stat label="Processing" value={totals.processing} />
          <Stat label="Paid" value={totals.paid} green />
          <Stat label="Amount" value={`SSP ${money(totals.totalAmount)}`} />
        </div>

        {/* LIST */}
        <div className="mt-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 p-4 rounded-xl text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-zinc-500 text-center">Loading...</div>
          ) : (
            <div className="border border-zinc-800 rounded-2xl overflow-hidden">
              {refunds.length === 0 ? (
                <div className="p-6 text-zinc-500">
                  No refunds for this event yet.
                </div>
              ) : (
                refunds.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRefund(r)}
                    className="grid grid-cols-6 items-center px-6 py-4 border-b border-zinc-800 hover:bg-white/5 cursor-pointer"
                  >
                    <div className="font-bold">
                      SSP {money(r.amount)}
                    </div>
                    <div>Order #{r.order_id}</div>
                    <div className="text-sm">{r.customer_email}</div>
                    <div className="text-sm">
                      {formatDate(r.requested_at)}
                    </div>
                    <div className="truncate text-sm">
                      {r.reason || "—"}
                    </div>
                    <div className="flex justify-end">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${badgeClass(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {selectedRefund && (
          <RefundModal
            refund={selectedRefund}
            onClose={() => setSelectedRefund(null)}
          />
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
      <div className={`mt-2 text-2xl font-extrabold ${color}`}>
        {value}
      </div>
    </div>
  );
}

function RefundModal({ refund, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold mb-4">Refund Details</h2>

        <Detail label="Reference" value={refund.reference} />
        <Detail label="Amount" value={`SSP ${money(refund.amount)}`} />
        <Detail label="Status" value={refund.status} />
        <Detail label="Requested At" value={formatDate(refund.requested_at)} />
        <Detail label="Approved At" value={formatDate(refund.approved_at)} />
        <Detail label="Paid At" value={formatDate(refund.paid_at)} />

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
    <div className="flex justify-between text-sm mb-2">
      <div className="text-zinc-400">{label}</div>
      <div className="font-bold text-right break-words">
        {value || "—"}
      </div>
    </div>
  );
}