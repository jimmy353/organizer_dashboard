export const dynamic = "force-dynamic";

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputsRef = useRef([]);

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
  /* HANDLE OTP INPUT */
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

  const handleVerify = async () => {
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp: finalOtp,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.error || "OTP verification failed");
        setLoading(false);
        return;
      }

      alert("Email Verified ✅ You can now login.");
      router.push("/login");
    } catch (err) {
      alert("Something went wrong");
    }

    setLoading(false);
  };

  /* ========================= */
  /* RESEND OTP */
  /* ========================= */

  const handleResend = async () => {
    if (!email) {
      alert("Email is required");
      return;
    }

    if (timer > 0) {
      alert(`Please wait ${timer}s before resending`);
      return;
    }

    setResendLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-otp/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.error || "Failed to resend OTP");
        setResendLoading(false);
        return;
      }

      alert("New OTP sent ✅");
      setTimer(60);
    } catch (err) {
      alert("Something went wrong");
    }

    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white px-6">
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-3xl w-[420px] shadow-2xl">

        <h1 className="text-3xl font-bold text-emerald-400 text-center mb-4">
          Verify Email
        </h1>

        <p className="text-gray-400 text-center mb-6 text-sm">
          Enter the 6-digit OTP sent to your email
        </p>

        {/* EMAIL */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-6 outline-none"
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
              className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/10 border border-emerald-400/40 outline-none"
            />
          ))}
        </div>

        {/* VERIFY BUTTON */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-emerald-400 text-black py-3 rounded-xl font-bold mb-4"
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
          onClick={handleResend}
          disabled={resendLoading || timer > 0}
          className={`w-full mt-3 py-2 rounded-xl font-bold ${
            timer > 0
              ? "bg-white/10 text-gray-500"
              : "bg-transparent text-emerald-400"
          }`}
        >
          {resendLoading ? "Sending..." : "Resend OTP"}
        </button>

        {/* BACK TO LOGIN */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Back to{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-emerald-400 font-bold cursor-pointer"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}