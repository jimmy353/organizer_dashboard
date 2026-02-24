"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const STORAGE_KEY = "WEB_SCAN_HISTORY";
const SCAN_LOCK_MS = 3000;

function money(n) {
  return Number(n || 0).toFixed(2);
}

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState([]);
  const [eventId, setEventId] = useState("");
  const [eventTitle, setEventTitle] = useState("Ticket Scanner");

  const scannerRef = useRef(null);
  const lastScanRef = useRef({ code: null, time: 0 });

  /* ================= LOAD HISTORY ================= */

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  function saveHistory(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setHistory(data);
  }

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    let valid = 0,
      invalid = 0,
      pending = 0;

    history.forEach((h) => {
      if (h.status === "VALID") valid++;
      else if (h.status === "INVALID") invalid++;
      else pending++;
    });

    return {
      valid,
      invalid,
      pending,
      total: history.length,
    };
  }, [history]);

  /* ================= CLEAR ================= */

  function clearHistory() {
    if (!confirm("Clear scan history?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }

  /* ================= START CAMERA ================= */

  async function startScanner() {
    if (!eventId) {
      alert("Please enter Event ID first.");
      return;
    }

    setScanning(true);

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      handleScan,
      () => {}
    );
  }

  async function stopScanner() {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    }
    setScanning(false);
  }

  /* ================= HANDLE SCAN ================= */

  async function handleScan(decodedText) {
    const now = Date.now();

    if (
      lastScanRef.current.code === decodedText &&
      now - lastScanRef.current.time < SCAN_LOCK_MS
    ) {
      return;
    }

    lastScanRef.current = { code: decodedText, time: now };

    const entry = {
      id: now.toString(),
      code: decodedText,
      time: new Date().toLocaleTimeString(),
      event: eventTitle,
      status: "PENDING",
    };

    let newHistory = [entry, ...history].slice(0, 50);
    saveHistory(newHistory);

    try {
      const res = await fetch(`${API_URL}/api/tickets/scan/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          ticket_code: decodedText,
          event_id: eventId,
        }),
      });

      if (!res.ok) {
        newHistory[0].status = "INVALID";
      } else {
        newHistory[0].status = "VALID";
      }

      saveHistory([...newHistory]);
    } catch {
      newHistory[0].status = "INVALID";
      saveHistory([...newHistory]);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">
              {eventTitle}
            </h1>
            <p className="text-sm text-green-400">
              ✅ {stats.valid} | ❌ {stats.invalid} | ⏳ {stats.pending} | 📊 {stats.total}
            </p>
          </div>

          <button
            onClick={clearHistory}
            className="bg-red-600 px-4 py-2 rounded-xl hover:bg-red-500"
          >
            Clear
          </button>
        </div>

        {/* EVENT INPUT */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <input
            placeholder="Event ID"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          />
          <input
            placeholder="Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          />

          {!scanning ? (
            <button
              onClick={startScanner}
              className="bg-green-500 text-black font-bold rounded-xl"
            >
              Start Scan
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="bg-yellow-500 text-black font-bold rounded-xl"
            >
              Stop
            </button>
          )}
        </div>

        {/* CAMERA */}
        <div className="mt-6 rounded-3xl overflow-hidden border border-zinc-800">
          <div id="reader" className="w-full"></div>
        </div>

        {/* HISTORY */}
        <div className="mt-8 space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-xl p-3"
            >
              <div className="text-sm text-zinc-400">
                {item.code.slice(0, 8)}…
              </div>

              <div
                className={
                  item.status === "VALID"
                    ? "text-green-400 font-bold"
                    : item.status === "INVALID"
                    ? "text-red-400 font-bold"
                    : "text-yellow-400 font-bold"
                }
              >
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}