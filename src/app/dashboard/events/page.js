"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    category: "music",
    payout_done: false,
    image: null,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const token = localStorage.getItem("access");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/events/organizer/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.clear();
        router.push("/login");
        return;
      }

      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error(error);
      alert("Error loading events");
    }

    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();

    const token = localStorage.getItem("access");

    const startDateTime = `${form.start_date}T${form.start_time}`;
    const endDateTime = `${form.end_date}T${form.end_time}`;

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("location", form.location);
    formData.append("start_date", startDateTime);
    formData.append("end_date", endDateTime);
    formData.append("category", form.category);
    formData.append("payout_done", form.payout_done);

    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      const res = await fetch(`${API_URL}/api/events/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Create failed");
      }

      setShowCreate(false);
      fetchEvents();
    } catch (error) {
      alert("Failed to create event");
    }
  }

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Your Events</h1>

      <button
        onClick={() => setShowCreate(!showCreate)}
        className="bg-green-500 px-6 py-3 rounded-xl mb-6"
      >
        + Add Event
      </button>

      {loading && <p>Loading events...</p>}

      {events.map((event) => (
        <div key={event.id} className="bg-zinc-900 p-4 rounded-xl mb-4">
          <h2 className="text-xl font-bold">{event.title}</h2>
          <p>{event.location}</p>
        </div>
      ))}
    </div>
  );
}