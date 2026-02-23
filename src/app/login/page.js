"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  /* ========================= */
  /* LOGIN */
  /* ========================= */

  async function handleLogin(e) {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await fetch(`${API_URL}/api/auth/login-role/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        role: "organizer",
      }),
    });

    const data = await res.json();

    /* ========================= */
    /* ORGANIZER STATUS HANDLING */
    /* ========================= */

    if (!res.ok) {

      // 🔒 Not verified
      if (data.status === "not_verified") {
        setLoading(false);
        router.push(`/verify-otp?email=${email}`);
        return;
      }

      // ⏳ Under review
      if (data.status === "pending") {
        setError("Your request is under review. You can login once approved.");
        setLoading(false);
        return;
      }

      // ❌ Rejected
      if (data.status === "rejected") {
        setError("Your organizer request was rejected. Please contact support.");
        setLoading(false);
        return;
      }

      // ❌ Not requested
      if (data.status === "not_requested") {
        setError("You have not submitted an organizer request.");
        setLoading(false);
        return;
      }

      setError(data.detail || "Invalid credentials");
      setLoading(false);
      return;
    }

    /* ========================= */
    /* SUCCESS LOGIN */
    /* ========================= */

    if (!data.access || !data.refresh) {
      setError("Invalid token response from server");
      setLoading(false);
      return;
    }

    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("role", "organizer");

    router.push("/dashboard/events");

  } catch {
    setError("Network error");
  }

  setLoading(false);
}

  /* ========================= */
  /* FORGOT PASSWORD */
  /* ========================= */

  async function handleForgotPassword() {
    if (!forgotEmail) {
      alert("Please enter your email");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Something went wrong");
        setForgotLoading(false);
        return;
      }

      alert("OTP Sent ✅");

      setForgotVisible(false);
      router.push(`/verify-otp?email=${forgotEmail}`);
      setForgotEmail("");
    } catch {
      alert("Server error");
    }

    setForgotLoading(false);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 text-white">

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl"
      >
        <h1 className="text-3xl font-bold text-[#7CFF00] mb-6 text-center">
          Login
        </h1>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-4 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-2 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div
          onClick={() => {
            setForgotEmail(email);
            setForgotVisible(true);
          }}
          className="text-right text-[#7CFF00] font-bold text-sm mb-4 cursor-pointer"
        >
          Forgot Password?
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#7CFF00] text-black py-3 rounded-full font-bold"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* SIGNUP LINK FIXED */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#7CFF00] font-bold hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </form>

      {/* ============================= */}
      {/* FORGOT PASSWORD MODAL */}
      {/* ============================= */}

      {forgotVisible && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center px-6 z-50">
          <div className="bg-[#111] border border-[#7CFF00]/40 p-8 rounded-2xl w-full max-w-md">

            <h2 className="text-2xl font-bold text-[#7CFF00] text-center mb-3">
              Forgot Password
            </h2>

            <p className="text-gray-400 text-center text-sm mb-5">
              Enter your email and we will send you OTP to reset password.
            </p>

            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-5 outline-none"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />

            <button
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="w-full bg-[#7CFF00] text-black py-3 rounded-full font-bold"
            >
              {forgotLoading ? "Sending..." : "Send OTP"}
            </button>

            <div
              onClick={() => setForgotVisible(false)}
              className="text-center text-gray-400 font-bold mt-4 cursor-pointer"
            >
              Cancel
            </div>

          </div>
        </div>
      )}

    </div>
  );
}