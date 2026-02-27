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
    try {
      const token = localStorage.getItem("access");

      const res = await fetch(
        `${API_URL}/api/auth/organizer/settings/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error(await res.text());
        setLoading(false);
        return;
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Settings load error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("access");

      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      const res = await fetch(
        `${API_URL}/api/auth/organizer/settings/`, // ✅ fixed endpoint
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
        fetchSettings();
      } else {
        const err = await res.text();
        console.error(err);
        setMessage("Failed to update settings ❌");
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage("Unexpected error ❌");
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

  if (!data) return null;

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-10">

        <h1 className="text-3xl font-extrabold">
          Organizer Settings
        </h1>

        {/* BUSINESS PROFILE */}
        <section className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          <h2 className="text-xl font-bold text-green-400 mb-6">
            Business Profile
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
            preview={typeof data.logo === "string" ? data.logo : null}
            onChange={(file) => setData({ ...data, logo: file })}
          />

          <FileInput
            label="Banner"
            preview={typeof data.banner === "string" ? data.banner : null}
            onChange={(file) => setData({ ...data, banner: file })}
          />
        </section>

        {/* PAYOUT */}
        <section className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          <h2 className="text-xl font-bold text-yellow-400 mb-6">
            Payout & Finance
          </h2>

          <select
            value={data.payout_provider || "momo"}
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

          <label className="flex items-center gap-3 mt-6">
            <input
              type="checkbox"
              checked={data.auto_payout || false}
              onChange={(e) =>
                setData({ ...data, auto_payout: e.target.checked })
              }
            />
            Enable Auto Payout
          </label>

          {/* Commission Info */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <StatCard title="Platform Commission" value="10%" />
            <StatCard title="Your Share" value="90%" />
            <StatCard title="Auto Payout" value={data.auto_payout ? "Enabled" : "Disabled"} />
          </div>
        </section>

        {/* SECURITY */}
        <section className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
          <h2 className="text-xl font-bold text-red-400 mb-6">
            Security
          </h2>

          <button
            onClick={() => window.location.href = "/dashboard/change-password"}
            className="w-full bg-red-500/10 border border-red-500/20 py-4 rounded-xl hover:bg-red-500/20 transition"
          >
            Change Password
          </button>
        </section>

        {/* DANGER ZONE */}
        <section className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5">
          <h2 className="text-lg font-bold text-red-400 mb-6">
            Danger Zone
          </h2>

          <button className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition">
            Delete Account
          </button>
        </section>

        {/* SAVE BUTTON */}
        <div>
          <button
            onClick={handleSave}
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
        </div>

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

function FileInput({ label, onChange, preview }) {
  return (
    <div className="mb-6">
      <label className="block mb-2 text-sm text-zinc-400">
        {label}
      </label>

      {preview && (
        <img
          src={preview}
          alt="preview"
          className="mb-3 rounded-xl border border-zinc-700 max-h-32 object-cover"
        />
      )}

      <input
        type="file"
        onChange={(e) => onChange(e.target.files[0])}
        className="w-full text-sm"
      />
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-black/40 p-4 rounded-xl border border-zinc-700">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="text-xl font-bold mt-1 text-white">{value}</div>
    </div>
  );
}