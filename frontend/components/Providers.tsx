"use client";

import { SettingsProvider } from "@/context/SettingsContext";
import { SessionProvider } from "next-auth/react";

import { ThemeProvider } from "@/components/theme-provider";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ConfirmationProvider } from "@/context/ConfirmationContext";
import { SocketProvider } from "@/context/SocketContext";
import { TranslationProvider } from "@/context/TranslationContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/lib/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <SocketProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <SettingsProvider>
              <TranslationProvider>
                <CartProvider>
                  <WishlistProvider>
                    <ConfirmationProvider>
                        {children}
                    </ConfirmationProvider>
                  </WishlistProvider>
                </CartProvider>
              </TranslationProvider>
            </SettingsProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SocketProvider>
    </SessionProvider>
  );
}
