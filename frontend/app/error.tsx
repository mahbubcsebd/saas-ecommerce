'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-red-50 p-4 rounded-full mb-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        We encountered an error while processing your request. This might be a temporary issue.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} className="flex items-center gap-2">
          <RefreshCcw className="w-4 h-4" />
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.assign('/')}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
