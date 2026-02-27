"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/store/useCartStore";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [email, setEmail] = useState("superadmin@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const guestId = useCartStore.getState().guestId;
      console.log('Attempting login with:', { email, password, guestId }); // DEBUG LOG
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        guestId,
      });

      if (res?.error) {
        toast.error(res.error === "CredentialsSignin" ? "Invalid credentials. Please check your email/phone and password." : res.error);
      } else {
        toast.success("Logged in successfully!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
        console.error(error);
        toast.error("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-muted-foreground">Enter your email, username or phone below to login</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email, Username or Phone</Label>
          <Input
            id="email"
            type="text"
            name="email"
            autoComplete="off"
            placeholder="Email, username or phone"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </div>
  );
}
