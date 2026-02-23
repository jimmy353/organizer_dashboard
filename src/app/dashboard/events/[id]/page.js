"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ViewEvent() {
  const { id } = useParams();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, []);

  async function fetchEvent() {
    const token = localStorage.getItem("access");

    const res = await fetch(`${API_URL}/api/events/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setEvent(data);
  }

  if (!event) return <p className="p-10 text-white">Loading...</p>;

  return (
    <div className="p-10 text-white max-w-3xl">
      {event.image && (
        <img
          src={event.image}
          className="w-full h-64 object-cover rounded-xl mb-6"
        />
      )}

      <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
      <p className="text-gray-400">{event.location}</p>
      <p className="mt-6">{event.description}</p>

      <button
        onClick={() =>
          router.push(`/dashboard/events/${id}/edit`)
        }
        className="bg-yellow-500 px-6 py-3 rounded-xl mt-8"
      >
        Edit Event
      </button>
    </div>
  );
}