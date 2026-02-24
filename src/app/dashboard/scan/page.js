"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const STORAGE_KEY = "WEB_SCAN_HISTORY";
const SCAN_LOCK_MS = 3000;

export default function ScanPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [popup, setPopup] = useState(null); // SUCCESS / ERROR

  const scannerRef = useRef(null);
  const lastScanRef = useRef({ code: null, time: 0 });

  /* ================= LOAD EVENTS ================= */

  useEffect(() => {
    loadEvents();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  async function loadEvents() {
    const res = await fetch(`${API_URL}/api/events/organizer/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) setSelectedEvent(data[0]);
    }
  }

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

    return { valid, invalid, pending, total: history.length };
  }, [history]);

  /* ================= SOUND ================= */

  function playSound(type) {
    const audio = new Audio(
      type === "success"
        ? "/success.mp3"
        : "/error.mp3"
    );
    audio.play();
  }

  /* ================= START SCANNER ================= */

  async function startScanner() {
    if (!selectedEvent) {
      alert("Please select event first.");
      return;
    }

    setScanning(true);

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      handleScan
    );
  }

  async function stopScanner() {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
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
          event_id: selectedEvent.id,
        }),
      });

      if (!res.ok) {
        newHistory[0].status = "INVALID";
        playSound("error");
        showPopup("INVALID ❌", false);
      } else {
        newHistory[0].status = "VALID";
        playSound("success");
        showPopup("VALID ✅", true);
      }

      saveHistory([...newHistory]);
    } catch {
      newHistory[0].status = "INVALID";
      saveHistory([...newHistory]);
    }
  }

  function showPopup(text, success) {
    setPopup({ text, success });
    setTimeout(() => setPopup(null), 1500);
  }

  /* ================= CLEAR ================= */

  function clearHistory() {
    if (!confirm("Clear scan history?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-extrabold">Ticket Scanner</h1>

        <p className="mt-2 text-green-400 text-sm">
          ✅ {stats.valid} | ❌ {stats.invalid} | ⏳ {stats.pending} | 📊 {stats.total}
        </p>

        {/* EVENT DROPDOWN */}
        <div className="mt-6">
          <select
            value={selectedEvent?.id || ""}
            onChange={(e) =>
              setSelectedEvent(
                events.find((ev) => ev.id === Number(e.target.value))
              )
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        {/* BUTTONS */}
        <div className="mt-4 flex gap-4">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="flex-1 bg-green-500 text-black font-bold py-3 rounded-xl"
            >
              Start Scan
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex-1 bg-yellow-500 text-black font-bold py-3 rounded-xl"
            >
              Stop Scan
            </button>
          )}

          <button
            onClick={clearHistory}
            className="bg-red-600 px-4 rounded-xl"
          >
            Clear
          </button>
        </div>

        {/* CAMERA */}
        <div className="mt-6 relative border border-green-500 rounded-3xl overflow-hidden">
          <div id="reader" className="w-full" />

          {/* Animated Frame */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-10 border-4 border-green-500 rounded-xl animate-pulse"></div>
            </div>
          )}
        </div>

        {/* POPUP */}
        {popup && (
          <div
            className={`fixed inset-0 flex items-center justify-center z-50 ${
              popup.success ? "bg-green-600/30" : "bg-red-600/30"
            }`}
          >
            <div className="bg-black px-8 py-6 rounded-3xl text-2xl font-bold">
              {popup.text}
            </div>
          </div>
        )}

        {/* HISTORY */}
        <div className="mt-8 space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-3"
            >
              <span className="text-zinc-400">
                {item.code.slice(0, 8)}…
              </span>

              <span
                className={
                  item.status === "VALID"
                    ? "text-green-400 font-bold"
                    : item.status === "INVALID"
                    ? "text-red-400 font-bold"
                    : "text-yellow-400 font-bold"
                }
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}