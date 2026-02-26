"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import React, { createContext, useContext, useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  sellingPrice: number;
  images: string[];
  stock: number;
}

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: Product;
  variant?: {
    id: string;
    name: string;
    sellingPrice?: number;
    basePrice?: number;
    images?: string[];
    stock: number;
  };
}

interface CartContextType {
  cart: { id: string; items: CartItem[] } | null;
  loading: boolean;
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  guestId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const getHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    return headers;
  };

  // 1. Initial Load of Local Cart
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("mahbub_shop_cart");
    if (stored) {
      try {
        setLocalCart(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse local cart", e);
      }
    }
  }, []);

  // 2. Persist Local Cart
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("mahbub_shop_cart", JSON.stringify(localCart));
    }
  }, [localCart, isMounted]);

  // 3. SERVER CART: Fetch only if authenticated
  const { data: serverCart, isLoading: isServerLoading } = useQuery({
    queryKey: ["cart", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/cart`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const json = await res.json();
      return json.data || null; // Ensure not undefined
    },
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5,
  });

  // 4. MERGE LOGIC
  const mergeMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const res = await fetch(`${API_URL}/cart/merge`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Merge failed");
      return res.json();
    },
    onSuccess: () => {
      // Clear local cart after successful merge
      setLocalCart([]);
      localStorage.removeItem("mahbub_shop_cart");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  useEffect(() => {
    if (status === "authenticated" && localCart.length > 0 && !mergeMutation.isPending && !mergeMutation.isSuccess) {
      // Prepare items for merge (minimal data needed by backend)
      const itemsToMerge = localCart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }));
      mergeMutation.mutate(itemsToMerge);
    }
  }, [status, localCart, mergeMutation]); // Add mergeMutation to dependency to check state

  // 5. HELPER: Fetch Product Details for Local Cart (Single Item)
  const fetchProductDetails = async (productId: string) => {
    const res = await fetch(`${API_URL}/products/${productId}`);
    const json = await res.json();
    return json.data;
  };

  // ACTIONS

  const addToCart = async (productId: string, quantity: number, variantId?: string) => {
    if (status === "authenticated") {
      // Server Action
      const res = await fetch(`${API_URL}/cart/add`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity, variantId }),
      });
      if (!res.ok) throw new Error("Failed to add to server cart");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } else {
      // Local Action
      const product = await fetchProductDetails(productId);
      if (!product) throw new Error("Product not found");

      let unitPrice = product.sellingPrice;
      let variantData = null;

      if (variantId) {
        const v = product.variants?.find((v: any) => v.id === variantId);
        if (v) {
          unitPrice = v.sellingPrice || product.sellingPrice;
          variantData = { ...v };
        }
      }

      setLocalCart(prev => {
        const existingIdx = prev.findIndex(item => item.productId === productId && item.variantId === variantId);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx].quantity += quantity;
          updated[existingIdx].total = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
          return updated;
        } else {
          const newItem: CartItem = {
            id: `local_${Date.now()}`,
            productId,
            variantId,
            quantity,
            unitPrice,
            total: unitPrice * quantity,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              basePrice: product.basePrice,
              sellingPrice: product.sellingPrice,
              images: product.images,
              stock: product.stock
            },
            variant: variantData
          };
          return [...prev, newItem];
        }
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (status === "authenticated") {
      await fetch(`${API_URL}/cart/items/${itemId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } else {
      setLocalCart(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (status === "authenticated") {
       await fetch(`${API_URL}/cart/items/${itemId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ quantity }),
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } else {
      setLocalCart(prev => prev.map(item => {
        if (item.id === itemId) {
            return { ...item, quantity, total: item.unitPrice * quantity };
        }
        return item;
      }));
    }
  };

  const clearCart = () => {
     if (status === "authenticated") {
         // Implement server clear if needed, or loop delete
         // For now, simple local clear visual
     }
     setLocalCart([]);
     localStorage.removeItem("mahbub_shop_cart");
     queryClient.setQueryData(["cart", session?.user?.id], null);
  };

  // DERIVE CURRENT CART
  const activeCart = status === "authenticated" ? serverCart : {
    id: "local-cart",
    items: localCart,
    subtotal: localCart.reduce((acc, item) => acc + item.total, 0),
    total: localCart.reduce((acc, item) => acc + item.total, 0)
  };

  return (
    <CartContext.Provider value={{
      cart: activeCart || { id: 'empty', items: [] },
      loading: isServerLoading || mergeMutation.isPending,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      guestId: null // No longer used
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
