'use client';

import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    sellingPrice: number;
    basePrice: number;
    category: any;
    stock: number;
  };
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchWishlist = async () => {
    if (!session?.accessToken) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [session?.accessToken]);

  const toggleWishlist = async (productId: string) => {
    if (!session?.accessToken) {
      toast.error('Please login to use wishlist');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isWishlisted) {
          toast.success('Added to wishlist');
        } else {
          toast.success('Removed from wishlist');
        }
        await fetchWishlist();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to toggle wishlist');
      }
    } catch (error) {
      console.error('Failed to toggle wishlist', error);
      toast.error('Something went wrong');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(
      (item) =>
        String(item.productId) === String(productId) ||
        String(item.product?.id) === String(productId)
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        toggleWishlist,
        isInWishlist,
        refetchWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
