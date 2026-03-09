"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const STORAGE_KEY = "WEB_SCAN_HISTORY";
const OFFLINE_QUEUE_KEY = "OFFLINE_SCAN_QUEUE";
const SCAN_LOCK_MS = 800;

export default function ScanPage() {

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [popup, setPopup] = useState(null);
  const [flash, setFlash] = useState(null);

  const scannerRef = useRef(null);
  const lastScanRef = useRef({ code: null, time: 0 });

  const successSoundRef = useRef(null);
  const errorSoundRef = useRef(null);

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

  /* ================= OFFLINE QUEUE ================= */

  function getOfflineQueue() {

    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);

    return data ? JSON.parse(data) : [];
  }

  function saveOfflineQueue(queue) {

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  function addOfflineScan(scan) {

    const queue = getOfflineQueue();

    queue.push(scan);

    saveOfflineQueue(queue);
  }

  /* ================= AUTO SYNC ================= */

  useEffect(() => {

    async function syncOfflineScans() {

      const queue = getOfflineQueue();

      if (queue.length === 0) return;

      const remaining = [];

      for (const scan of queue) {

        try {

          const res = await fetch(`${API_URL}/api/tickets/scan/`, {

            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access")}`,
            },

            body: JSON.stringify(scan),

          });

          if (!res.ok) remaining.push(scan);

        } catch {

          remaining.push(scan);

        }

      }

      saveOfflineQueue(remaining);

    }

    window.addEventListener("online", syncOfflineScans);

    syncOfflineScans();

  }, []);

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

    try {

      if (type === "success" && successSoundRef.current) {

        successSoundRef.current.currentTime = 0;

        successSoundRef.current.play();
      }

      if (type === "error" && errorSoundRef.current) {

        errorSoundRef.current.currentTime = 0;

        errorSoundRef.current.play();
      }

    } catch (err) {

      console.log("Sound blocked", err);

    }
  }

  /* ================= VIBRATION ================= */

  function vibrate(type) {

    if (!navigator.vibrate) return;

    if (type === "success") navigator.vibrate(120);

    else navigator.vibrate([80, 40, 80]);
  }

  /* ================= START SCANNER ================= */

  async function startScanner() {

    successSoundRef.current = new Audio("/success.mp3");
    errorSoundRef.current = new Audio("/error.mp3");

    successSoundRef.current.load();
    errorSoundRef.current.load();

    if (!selectedEvent) {

      alert("Please select event first.");

      return;
    }

    setScanning(true);

    const html5QrCode = new Html5Qrcode("reader");

    scannerRef.current = html5QrCode;

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 15,
        qrbox: 250,
      },
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

        vibrate("error");

        showPopup("INVALID ❌", false);

      } else {

        newHistory[0].status = "VALID";

        playSound("success");

        vibrate("success");

        showPopup("VALID ✅", true);
      }

      saveHistory([...newHistory]);

    } catch {

      addOfflineScan({
        ticket_code: decodedText,
        event_id: selectedEvent.id,
      });

      newHistory[0].status = "OFFLINE";

      playSound("success");

      vibrate("success");

      showPopup("OFFLINE ✔", true);

      saveHistory([...newHistory]);
    }
  }

  /* ================= POPUP + FLASH ================= */

  function showPopup(text, success) {

    setPopup({ text, success });

    setFlash(success ? "green" : "red");

    setTimeout(() => {

      setPopup(null);

      setFlash(null);

    }, 800);
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

        {/* EVENT SELECT */}

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

        </div>

        {/* FLASH */}

        {flash && (

          <div
            className={`fixed inset-0 z-40 pointer-events-none ${
              flash === "green"
                ? "bg-green-500/40"
                : "bg-red-500/40"
            }`}
          />

        )}

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