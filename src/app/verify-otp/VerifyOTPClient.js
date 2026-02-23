"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyOTPClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputsRef = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleVerify = async () => {
    const finalOtp = otp.join("");

    if (!email || finalOtp.length !== 6) {
      alert("Invalid OTP");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: finalOtp }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "OTP verification failed");
        setLoading(false);
        return;
      }

      alert("Verified ✅");
      router.push("/login");
    } catch {
      alert("Error verifying OTP");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-3xl w-[420px] shadow-2xl">
        <h1 className="text-3xl font-bold text-emerald-400 text-center mb-6">
          Verify Email
        </h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/10 px-4 py-3 rounded-xl mb-6"
        />

        <div className="flex justify-between mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/10 border border-emerald-400/40"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-emerald-400 text-black py-3 rounded-xl font-bold"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </div>
    </div>
  );
}