'use client';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSettings } from '@/context/SettingsContext';
import { useTranslations } from '@/context/TranslationContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCartStore } from '@/store/useCartStore';
import { Heart, LogOut, Menu, ShoppingCart, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { ModeToggle } from './mode-toggle';
import SearchWithSuggestions from './SearchWithSuggestions';
import { Button } from './ui/button';

export default function Header() {
  const cart = useCartStore((state) => state.cart);
  const { wishlist } = useWishlist();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-visible">
      <div className="container mx-auto flex h-16 items-center gap-4">
        {/* Logo */}
        <Link className="flex items-center space-x-2 shrink-0" href="/">
          {settings?.general?.headerLogo || settings?.general?.logoUrl ? (
            <img
              src={settings.general.headerLogo || settings.general.logoUrl}
              alt={settings.general.siteName}
              className="h-10 w-auto"
            />
          ) : (
            <span className="font-bold text-2xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {settings?.general?.siteName || 'Mahbub Shop'}
            </span>
          )}
        </Link>

        {/* Search - Centered and Larger */}
        <div className="flex-1 max-w-2xl mx-auto px-4 hidden md:block">
          <SearchWithSuggestions />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="hidden md:flex items-center gap-2">
            <ModeToggle />
            <LanguageSwitcher />
          </div>

          {session && <NotificationBell />}

          {/* Account */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                    <AvatarFallback>{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">{t('common', 'profile')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/orders">{t('common', 'orders')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/address">{t('common', 'addresses')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist">{t('common', 'wishlist')}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('common', 'logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden md:flex">
                <Link href="/auth/login">{t('common', 'login')}</Link>
              </Button>
              <Button asChild size="sm" className="hidden md:flex">
                <Link href="/auth/register">{t('common', 'register')}</Link>
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden" asChild>
                <Link href="/auth/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Wishlist */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/wishlist">
              <Heart className="h-6 w-6" />
              <span className="sr-only">{t('common', 'wishlist')}</span>
              {wishlist && wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[11px] font-bold text-primary-foreground flex items-center justify-center animate-in zoom-in">
                  {wishlist.length}
                </span>
              )}
            </Link>
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-6 w-6" />
              <span className="sr-only">{t('common', 'cart')}</span>
              {cart?.items && cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[11px] font-bold text-primary-foreground flex items-center justify-center animate-in zoom-in">
                  {cart.items.length}
                </span>
              )}
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 py-4">
                <div className="font-bold text-xl">
                  {settings?.general?.siteName || 'Mahbub Shop'}
                </div>
                <div className="relative">
                  <SearchWithSuggestions />
                </div>
                <nav className="flex flex-col space-y-2">
                  <div className="font-semibold mb-2">{t('common', 'menu')}</div>
                  <Link href="/" className="px-2 py-1 hover:bg-muted rounded-md block">
                    {t('common', 'home')}
                  </Link>
                  <Link href="/products" className="px-2 py-1 hover:bg-muted rounded-md block">
                    {t('common', 'products')}
                  </Link>
                  <Link href="/categories" className="px-2 py-1 hover:bg-muted rounded-md block">
                    {t('common', 'categories')}
                  </Link>
                </nav>
                {/* We can add a vertical version of MegaMenu here later */}
                <div className="mt-auto border-t pt-4 flex items-center justify-between">
                  <LanguageSwitcher />
                  <ModeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
