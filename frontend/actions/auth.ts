"use server";

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function loginAction(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        const res = await fetch(`http://127.0.0.1:8000/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const result = await res.json();

        if (res.ok && result.success) {
            const cookieStore = await cookies();
            cookieStore.set("token", result.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

            return { success: true, message: "Login successful", user: result.data.user };
        } else {
            return { success: false, message: result.message || "Invalid credentials" };
        }
    } catch (error) {
        return { success: false, message: "Server error occurred" };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("token");
    return { success: true };
}
