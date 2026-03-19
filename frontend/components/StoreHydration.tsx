'use client';

import { useCartStore } from '@/store/useCartStore';
import { useEffect, useState } from 'react';

export default function StoreHydration() {
  const [hydrated, setHydrated] = useState(false);
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    // Initialize Guest ID if not present
    let storedGuestId = localStorage.getItem('guestId');
    if (!storedGuestId) {
      storedGuestId = crypto.randomUUID();
      localStorage.setItem('guestId', storedGuestId);
    }

    const { setGuestId } = useCartStore.getState();
    setGuestId(storedGuestId);
    fetchCart(storedGuestId);

    setHydrated(true);
  }, [fetchCart]);

  if (!hydrated) return null;

  return null;
}
