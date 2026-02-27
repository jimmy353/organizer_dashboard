"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SettingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const token = localStorage.getItem("access");

    const res = await fetch(
      `${API_URL}/api/accounts/organizer/settings/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const token = localStorage.getItem("access");

    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    const res = await fetch(
      `${API_URL}/api/accounts/organizer/settings/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (res.ok) {
      setMessage("Settings updated successfully ✅");
    } else {
      setMessage("Failed to update settings ❌");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-extrabold mb-8">
          Organizer Settings
        </h1>

        <form
          onSubmit={handleSave}
          className="space-y-8 bg-zinc-900 p-8 rounded-2xl border border-zinc-800"
        >

          {/* BUSINESS INFO */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-green-400">
              Business Information
            </h2>

            <Input
              label="Business Name"
              value={data.business_name || ""}
              onChange={(v) => setData({ ...data, business_name: v })}
            />

            <Input
              label="Business Phone"
              value={data.business_phone || ""}
              onChange={(v) => setData({ ...data, business_phone: v })}
            />

            <Textarea
              label="Description"
              value={data.description || ""}
              onChange={(v) => setData({ ...data, description: v })}
            />

            <FileInput
              label="Logo"
              onChange={(file) => setData({ ...data, logo: file })}
            />

            <FileInput
              label="Banner"
              onChange={(file) => setData({ ...data, banner: file })}
            />
          </div>

          {/* PAYOUT SETTINGS */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-yellow-400">
              Payout Settings
            </h2>

            <select
              value={data.payout_provider}
              onChange={(e) =>
                setData({ ...data, payout_provider: e.target.value })
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mb-4"
            >
              <option value="momo">MTN MoMo</option>
              <option value="mgurush">M-Gurush</option>
            </select>

            <Input
              label="Payout Phone"
              value={data.payout_phone || ""}
              onChange={(v) => setData({ ...data, payout_phone: v })}
            />

            <label className="flex items-center gap-3 mt-4">
              <input
                type="checkbox"
                checked={data.auto_payout}
                onChange={(e) =>
                  setData({ ...data, auto_payout: e.target.checked })
                }
              />
              Enable Auto Payout
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-500 text-black font-bold py-4 rounded-xl hover:bg-green-400 transition"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>

          {message && (
            <div className="text-center mt-4 text-sm">
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/* COMPONENTS */

function Input({ label, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-sm text-zinc-400">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
      />
    </div>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-sm text-zinc-400">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
      />
    </div>
  );
}

function FileInput({ label, onChange }) {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-sm text-zinc-400">
        {label}
      </label>
      <input
        type="file"
        onChange={(e) => onChange(e.target.files[0])}
        className="w-full text-sm"
      />
    </div>
  );
}