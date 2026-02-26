"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner"; // Assuming sonner is used for toasts

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid or missing verification token.");
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          toast.success("Email verified!");

          // Optional: Auto redirect after few seconds
          setTimeout(() => {
            router.push("/auth/login?verified=true");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed. The link may have expired.");
          toast.error(data.message || "Verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
        toast.error("Network error");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">Verifying Email...</h1>
              <p className="text-gray-500">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h1 className="text-2xl font-bold text-gray-900">Email Verified!</h1>
              <p className="text-gray-500">{message}</p>
              <p className="text-sm text-gray-400">Redirecting to login...</p>
              <Button asChild className="mt-4 w-full">
                <Link href="/auth/login">Go to Login</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
              <p className="text-gray-500">{message}</p>
              <div className="mt-6 flex w-full flex-col gap-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/sign-up">Sign Up Again</Link>
                </Button>
                 <Button asChild variant="ghost" className="w-full">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
