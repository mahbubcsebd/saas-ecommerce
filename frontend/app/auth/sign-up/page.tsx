'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useTranslations } from '@/context/TranslationContext';
import { toast } from 'sonner';

export default function SignUpPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({}); // Clear previous errors

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          data.message ||
            t('auth', 'registrationSuccess', { defaultValue: 'Account created successfully!' })
        );
        router.push('/auth/login');
      } else {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors: Record<string, string> = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
          toast.error(data.message || 'Validation failed');
        } else {
          toast.error(data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(
        t('common', 'networkError', { defaultValue: 'Network error. Please try again.' })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t('auth', 'signUp')}</h1>
        <p className="text-muted-foreground">
          {t('auth', 'signUpSubtitle', {
            defaultValue: 'Enter your information to create an account',
          })}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('common', 'firstName')}</Label>
            <Input
              id="firstName"
              placeholder="John"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t('common', 'lastName')}</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">{t('common', 'username', { defaultValue: 'Username' })}</Label>
          <Input
            id="username"
            placeholder="johndoe"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('common', 'email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth', 'passwordLabel')}</Label>
          <Input
            id="password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('common', 'processing') : t('auth', 'signUp')}
        </Button>
      </form>
      <div className="text-center text-sm">
        {t('auth', 'alreadyHaveAccount', { defaultValue: 'Already have an account?' })}{' '}
        <Link href="/auth/login" className="underline underline-offset-4">
          {t('auth', 'signIn')}
        </Link>
      </div>
    </div>
  );
}
