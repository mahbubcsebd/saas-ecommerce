"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { api } from "@/lib/api-client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export type ProfileState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function updateProfileAction(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      success: false,
      message: "You must be logged in to update your profile.",
    };
  }

  try {
    // We pass FormData directly if the API supports it,
    // or we transform it if needed. The current Profile page uses fetch with FormData.
    const res = await api.put<any>("/user/profile", formData, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    revalidatePath("/profile");

    return {
      success: true,
      message: "Profile updated successfully.",
    };
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return {
      success: false,
      message: error.message || "Failed to update profile. Please try again.",
    };
  }
}
