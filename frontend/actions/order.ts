"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { api } from "@/lib/api-client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export type OrderState = {
  success?: boolean;
  message?: string;
  orderId?: string;
  errors?: Record<string, string[]>;
};

export async function createOrderAction(
  prevState: OrderState,
  formData: any // Using any for now to allow structured data from the form
): Promise<OrderState> {
  const session = await getServerSession(authOptions);

  // Headers need to include token if available
  const headers: Record<string, string> = {};
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  try {
    const response = await api.post<any>("/orders", formData, {
      headers,
    });

    if (response) {
      revalidatePath("/profile/orders");
      return {
        success: true,
        message: "Order placed successfully.",
        orderId: response.id
      };
    }

    return { success: false, message: "Failed to place order." };
  } catch (error: any) {
    console.error("Order Action Error:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred during checkout."
    };
  }
}
