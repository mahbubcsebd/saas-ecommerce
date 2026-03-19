'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/context/TranslationContext';
import { useCartStore } from '@/store/useCartStore';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('mahbub');
  const [password, setPassword] = useState('12345678');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const guestId = useCartStore.getState().guestId;
      console.log('Attempting login with:', { email, password, guestId }); // DEBUG LOG
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        guestId,
      });

      if (res?.error) {
        toast.error(
          res.error === 'CredentialsSignin'
            ? t('auth', 'invalidCredentials', {
                defaultValue: 'Invalid credentials. Please check your email/phone and password.',
              })
            : res.error
        );
      } else {
        toast.success(t('auth', 'loginSuccess', { defaultValue: 'Logged in successfully!' }));
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        t('common', 'errorOccurred', { defaultValue: 'An error occurred during login.' })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t('common', 'login')}</h1>
        <p className="text-muted-foreground">{t('auth', 'loginSubtitle')}</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth', 'emailLabel')}</Label>
          <Input
            id="email"
            type="text"
            name="email"
            autoComplete="off"
            placeholder={t('auth', 'emailLabel')}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('auth', 'passwordLabel')}</Label>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {t('auth', 'forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} className="w-full" disabled={loading}>
          {loading ? t('common', 'processing') : t('common', 'login')}
        </Button>
      </div>
      <div className="text-center text-sm">
        {t('auth', 'dontHaveAccount')}{' '}
        <Link href="/auth/sign-up" className="underline underline-offset-4">
          {t('auth', 'signUp')}
        </Link>
      </div>
    </div>
  );
}
