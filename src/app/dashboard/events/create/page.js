"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateEvent() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    category: "music",
    start_date: "",
    end_date: "",
    payout_done: false,
    image: null,
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem("access");

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      if (form[key] !== null) formData.append(key, form[key]);
    });

    await fetch(`${API_URL}/api/events/create/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    router.push("/dashboard/events");
  }

  return (
    <div className="p-10 text-white max-w-3xl">
      <h1 className="text-3xl font-bold mb-10">Create Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          placeholder="Title"
          className="w-full p-4 bg-zinc-900 rounded-xl"
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <textarea
          placeholder="Description"
          className="w-full p-4 bg-zinc-900 rounded-xl"
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Location"
          className="w-full p-4 bg-zinc-900 rounded-xl"
          onChange={(e) =>
            setForm({ ...form, location: e.target.value })
          }
        />

        <input
          type="datetime-local"
          className="w-full p-4 bg-zinc-900 rounded-xl"
          onChange={(e) =>
            setForm({ ...form, start_date: e.target.value })
          }
        />

        <input
          type="datetime-local"
          className="w-full p-4 bg-zinc-900 rounded-xl"
          onChange={(e) =>
            setForm({ ...form, end_date: e.target.value })
          }
        />

        <select
          className="w-full p-4 bg-zinc-900 rounded-xl"
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
        >
          <option value="music">Music</option>
          <option value="sports">Sports</option>
          <option value="nightlife">Nightlife</option>
        </select>

        <input
          type="file"
          onChange={(e) =>
            setForm({ ...form, image: e.target.files[0] })
          }
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            onChange={(e) =>
              setForm({
                ...form,
                payout_done: e.target.checked,
              })
            }
          />
          <label>Payout Done</label>
        </div>

        <button className="bg-green-500 px-6 py-3 rounded-xl">
          Save Event
        </button>
      </form>
    </div>
  );
}