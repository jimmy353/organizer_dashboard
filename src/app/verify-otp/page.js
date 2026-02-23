import { Suspense } from "react";
import VerifyOTPClient from "./VerifyOTPClient";

export default function Page() {
  return (
    <Suspense>
      <VerifyOTPClient />
    </Suspense>
  );
}