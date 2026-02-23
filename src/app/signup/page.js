"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== password2) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          password,
          password2,
          role: "organizer",
          company_name: companyName,
          momo_number: momoNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.detail || "Signup failed");
        setLoading(false);
        return;
      }

      setMessage("Request Submitted ✅ We are reviewing your organizer request.");

      setTimeout(() => {
        router.push(`/verify-otp?email=${email}`);
      }, 1500);

    } catch {
      setMessage("Network error");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white px-6">
      <form
        onSubmit={handleSignup}
        className="bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-3xl w-[450px] shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-emerald-400 text-center mb-6">
          Organizer Sign Up
        </h1>

        {message && (
          <div className="mb-4 text-center text-sm text-emerald-400">
            {message}
          </div>
        )}

        <input
          type="text"
          placeholder="Full Name"
          className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-4 outline-none"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-4 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Phone"
          className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-4 outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Company Name"
          className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-4 outline-none"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="MoMo Number"
          className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-4 outline-none"
          value={momoNumber}
          onChange={(e) => setMomoNumber(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-4 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-6 outline-none"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-400 text-black py-3 rounded-xl font-bold hover:bg-emerald-500 transition"
        >
          {loading ? "Submitting..." : "Submit Organizer Request"}
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-emerald-400 font-bold cursor-pointer"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}