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

  // Selection
  selectedItemIds: string[];
  buyNowItem: CartItem | null;

  // Actions
  setCart: (cart: { id: string; items: CartItem[] } | null) => void;
  setLoading: (loading: boolean) => void;
  setGuestId: (guestId: string) => void;

  toggleSelectItem: (itemId: string) => void;
  selectAllItems: (itemIds: string[]) => void;
  clearSelection: () => void;
  setBuyNowItem: (item: CartItem | null) => void;

  // Handlers
  fetchCart: (guestId: string) => Promise<void>;
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
}

import { api } from '@/lib/api-client';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      loading: false,
      guestId: null,
      selectedItemIds: [],
      buyNowItem: null,

      setCart: (cart) => set({ cart }),
      setLoading: (loading) => set({ loading }),
      setGuestId: (guestId) => set({ guestId }),

      toggleSelectItem: (itemId) => set((state) => ({
         selectedItemIds: state.selectedItemIds.includes(itemId)
            ? state.selectedItemIds.filter(id => id !== itemId)
            : [...state.selectedItemIds, itemId]
      })),

      selectAllItems: (itemIds) => set({ selectedItemIds: itemIds }),
      clearSelection: () => set({ selectedItemIds: [] }),
      setBuyNowItem: (item) => set({ buyNowItem: item }),

      fetchCart: async (id) => {
        const guestId = id || get().guestId;
        console.log(`[useCartStore] fetchCart called with id: ${id || 'none'}, current guestId: ${get().guestId || 'none'}`);
        if (!guestId) {
          console.log(`[useCartStore] No guestId, skipping fetch`);
          return;
        }

        set({ loading: true });
        try {
          const data = await api.get<any>(`/cart?guestId=${guestId}`);
          console.log(`[useCartStore] Cart fetched successfully, items: ${data?.items?.length || 0}`);
          set({ cart: data });
        } catch (error) {
          console.error("Failed to fetch cart", error);
        } finally {
          set({ loading: false });
        }
      },

      addToCart: async (productId, quantity, variantId) => {
        const { guestId } = get();
        console.log(`[useCartStore] Adding to cart: productId=${productId}, guestId=${guestId || 'none'}`);
        // Allow if we have either a guestId OR a user might be logged in
        // (api client will handle auth headers/cookies)

        try {
          const data = await api.post<any>(`/cart/add`, {
            guestId: guestId || undefined,
            productId,
            quantity,
            variantId
          });
          console.log(`[useCartStore] Add to cart success, new items count: ${data?.items?.length || 0}`);
          set({ cart: data });
          // Re-fetch to ensure data consistency and derived fields
          if (guestId) {
            console.log(`[useCartStore] Re-fetching cart for guestId: ${guestId}`);
            await get().fetchCart(guestId);
          }
        } catch (error) {
          console.error("Failed to add to cart", error);
        }
      },

      removeFromCart: async (itemId) => {
        const { guestId } = get();
        try {
          const data = await api.delete<any>(`/cart/items/${itemId}?guestId=${guestId || ""}`);
          set({ cart: data });
          if (guestId) await get().fetchCart(guestId);
        } catch (error) {
          console.error("Failed to remove item", error);
        }
      },

      updateQuantity: async (itemId, quantity) => {
        const { guestId } = get();
        try {
          const data = await api.put<any>(`/cart/items/${itemId}?guestId=${guestId || ""}`, { quantity });
          set({ cart: data });
          if (guestId) await get().fetchCart(guestId);
        } catch (error) {
          console.error("Failed to update quantity", error);
        }
      },

      clearCart: async () => {
        const { guestId } = get();
        try {
          const data = await api.delete<any>(`/cart?guestId=${guestId || ""}`);
          set({ cart: data, selectedItemIds: [] });
          if (guestId) await get().fetchCart(guestId);
        } catch (error) {
          console.error("Failed to clear cart", error);
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ guestId: state.guestId }), // Only persist guestId
    }
  )
);
