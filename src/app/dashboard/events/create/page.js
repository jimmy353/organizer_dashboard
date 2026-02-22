"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateEventPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem("access");

    const res = await fetch(`${API_URL}/api/events/create/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: new FormData(e.target),
    });

    if (res.ok) {
      router.push("/dashboard/events");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-10 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl w-full max-w-lg"
      >
        <h1 className="text-3xl font-bold mb-8">
          Create Event
        </h1>

        <input
          name="title"
          placeholder="Title"
          className="w-full p-3 mb-4 bg-black border border-white/20 rounded-lg"
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full p-3 mb-4 bg-black border border-white/20 rounded-lg"
        />

        <input
          name="location"
          placeholder="Location"
          className="w-full p-3 mb-4 bg-black border border-white/20 rounded-lg"
        />

        <input
          type="file"
          name="image"
          className="w-full mb-6"
        />

        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 py-3 rounded-xl font-bold"
        >
          Create Event
        </button>
      </form>
    </div>
  );
}