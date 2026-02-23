"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 🔥 If email not verified
        if (data?.detail?.toLowerCase().includes("verify")) {
          router.push(`/verify-otp?email=${email}`);
          return;
        }

        setError(data.detail || "Login failed");
        setLoading(false);
        return;
      }

      // ✅ Save tokens
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      // Redirect to dashboard
      router.push("/dashboard/events");

    } catch (err) {
      setError("Network error. Try again.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center px-6 text-white">

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-3xl w-[420px] shadow-2xl">

        <h1 className="text-3xl font-bold text-emerald-400 text-center mb-6">
          Organizer Login
        </h1>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email"
            className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-4 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-2 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Forgot Password */}
          <div className="text-right mb-6">
            <span
              onClick={() => router.push("/forgot-password")}
              className="text-emerald-400 text-sm cursor-pointer hover:underline"
            >
              Forgot Password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-400 text-black font-bold py-3 rounded-xl transition hover:bg-emerald-500"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* Sign Up */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            className="text-emerald-400 font-bold cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>

      </div>
    </div>
  );
}