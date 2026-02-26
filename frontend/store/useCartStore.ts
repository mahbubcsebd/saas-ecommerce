"use client";

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    name: string;
    images: string[];
    slug: string;
    stock: number;
    sellingPrice: number;
    basePrice: number;
  };
  variantId?: string;
  variant?: {
    name: string;
    sellingPrice?: number;
    basePrice?: number;
    images?: string[];
  };
}

interface CartState {
  cart: { id: string; items: CartItem[] } | null;
  loading: boolean;
  guestId: string | null;

  // Actions
  setCart: (cart: { id: string; items: CartItem[] } | null) => void;
  setLoading: (loading: boolean) => void;
  setGuestId: (guestId: string) => void;

  // Handlers
  fetchCart: (guestId: string) => Promise<void>;
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      loading: false,
      guestId: null,

      setCart: (cart) => set({ cart }),
      setLoading: (loading) => set({ loading }),
      setGuestId: (guestId) => set({ guestId }),

      fetchCart: async (guestId) => {
        set({ loading: true });
        try {
          const res = await fetch(`${API_URL}/cart?guestId=${guestId}`);
          if (res.ok) {
            const data = await res.json();
            set({ cart: data.data });
          }
        } catch (error) {
          console.error("Failed to fetch cart", error);
        } finally {
          set({ loading: false });
        }
      },

      addToCart: async (productId, quantity, variantId) => {
        const { guestId } = get();
        if (!guestId) return;

        try {
          const res = await fetch(`${API_URL}/cart/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestId, productId, quantity, variantId }),
          });
          if (res.ok) {
            const data = await res.json();
            set({ cart: data.data });
            // Re-fetch to ensure data consistency
            await get().fetchCart(guestId);
          }
        } catch (error) {
          console.error("Failed to add to cart", error);
        }
      },

      removeFromCart: async (itemId) => {
        const { guestId } = get();
        try {
          const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            const currentCart = get().cart;
            if (currentCart) {
              set({
                cart: {
                  ...currentCart,
                  items: currentCart.items.filter((i) => i.id !== itemId),
                },
              });
            }
            if (guestId) await get().fetchCart(guestId);
          }
        } catch (error) {
          console.error("Failed to remove item", error);
        }
      },

      updateQuantity: async (itemId, quantity) => {
        const { guestId } = get();
        try {
          const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity }),
          });
          if (res.ok) {
            if (guestId) await get().fetchCart(guestId);
          }
        } catch (error) {
          console.error("Failed to update quantity", error);
        }
      },

      clearCart: () => set({ cart: null }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ guestId: state.guestId }), // Only persist guestId
    }
  )
);
