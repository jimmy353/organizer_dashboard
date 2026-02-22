"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (token) {
      router.replace("/dashboard/events");
    } else {
      router.replace("/login");
    }
  }, []);

  return null;
}