'use client';

import GlobalInput from '@/components/forms/GlobalInput';
import { ErrorMessage } from '@/components/global/ErrorMessage';
import { SuccessMessage } from '@/components/global/SuccessMessage';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: 'superadmin@example.com',
    password: 'password123',
  });

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'AccessDenied') {
      setError(
        'Access Denied: You do not have permission to access the dashboard.',
      );
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        if (res.error === 'CredentialsSignin') {
          setError(
            'Invalid credentials. Please check your email and password.',
          );
        } else {
          setError(res.error);
        }
        setLoading(false);
      } else if (res?.ok || !res?.error) {
        // Login successful
        toast.success('Logged in successfully!');
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
        router.refresh();
        return;
      } else {
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Login to Dashboard
          </CardTitle>
          <CardDescription className="text-center">
            Enter your admin credentials to access the panel.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <GlobalInput
              name="email"
              label="Email or Username"
              placeholder="admin@example.com"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <GlobalInput
              name="password"
              type="password"
              label="Password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !!success}
            >
              {loading || success ? 'Logging in...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
          <div className="text-slate-500">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
