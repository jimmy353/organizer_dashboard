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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /* ========================= */
  /* TIMER */
  /* ========================= */

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* ========================= */
  /* OTP INPUT HANDLING */
  /* ========================= */

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  /* ========================= */
  /* VERIFY OTP */
  /* ========================= */

  const handleVerifyOTP = async () => {
    const finalOtp = otp.join("");

    if (!email) {
      alert("Email is required");
      return;
    }

    if (finalOtp.length !== 6) {
      alert("OTP must be 6 digits");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: finalOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.error || "OTP verification failed");
        setLoading(false);
        return;
      }

      alert("Verified ✅ Email verified successfully.");
      router.push("/login");

    } catch (err) {
      alert("Something went wrong");
    }

    setLoading(false);
  };

  /* ========================= */
  /* RESEND OTP */
  /* ========================= */

  const handleResendOTP = async () => {
    if (!email) {
      alert("Email is required");
      return;
    }

    if (timer > 0) {
      alert(`Please wait ${timer}s before resending OTP`);
      return;
    }

    setResendLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/resend-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Resend failed");
        setResendLoading(false);
        return;
      }

      alert("OTP Sent ✅");
      setTimer(60);

    } catch {
      alert("Something went wrong");
    }

    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 text-white">
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-3xl w-[450px] shadow-2xl">

        <h1 className="text-3xl font-bold text-[#7CFF00] text-center mb-3">
          Verify Email
        </h1>

        <p className="text-gray-400 text-center text-sm mb-6">
          Enter the 6-digit OTP sent to your email
        </p>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-6 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* OTP BOXES */}
        <div className="flex justify-between mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/10 border border-[#7CFF00]/40 outline-none"
            />
          ))}
        </div>

        {/* VERIFY BUTTON */}
        <button
          onClick={handleVerifyOTP}
          disabled={loading}
          className="w-full bg-[#7CFF00] text-black py-3 rounded-full font-bold mb-4"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        {/* TIMER */}
        <p className="text-center text-gray-400 text-sm">
          {timer > 0
            ? `Resend OTP in ${timer}s`
            : "You can resend OTP now"}
        </p>

        {/* RESEND */}
        <button
          onClick={handleResendOTP}
          disabled={resendLoading || timer > 0}
          className={`w-full mt-3 py-2 rounded-full font-bold ${
            timer > 0
              ? "bg-white/10 text-gray-500"
              : "bg-transparent text-[#7CFF00]"
          }`}
        >
          {resendLoading ? "Sending..." : "Resend OTP"}
        </button>

        {/* BACK TO LOGIN */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Back to{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-[#7CFF00] font-bold cursor-pointer"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}