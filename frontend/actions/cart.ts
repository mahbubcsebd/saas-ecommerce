"use server";

import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function addToCartAction(prevState: any, formData: FormData) {
    const productId = formData.get("productId") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 1;
    const variantId = formData.get("variantId") as string || undefined;
    const guestId = formData.get("guestId") as string;

    if (!guestId) return { success: false, message: "Guest ID is required" };

    try {
        const res = await fetch(`${API_URL}/cart/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestId, productId, quantity, variantId }),
        });

        const result = await res.json();

        if (res.ok) {
            revalidatePath("/cart");
            return { success: true, message: "Added to cart", data: result.data };
        } else {
            return { success: false, message: result.message || "Failed to add to cart" };
        }
    } catch (error) {
        return { success: false, message: "Server error occurred" };
    }
}

export async function removeFromCartAction(itemId: string, guestId: string) {
    try {
        const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            revalidatePath("/cart");
            return { success: true, message: "Item removed" };
        }
        return { success: false, message: "Failed to remove item" };
    } catch (error) {
        return { success: false, message: "Server error occurred" };
    }
}
