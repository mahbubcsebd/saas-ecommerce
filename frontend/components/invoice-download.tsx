'use client';

import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner'; // Assuming sonner is used, or use your toast lib

interface InvoiceDownloadProps {
  orderId: string;
  invoiceNumber?: string;
}

export default function InvoiceDownload({ orderId, invoiceNumber }: InvoiceDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);

      // You can use the proxy route or direct call if you have auth token
      // Using proxy route as established in page.tsx
      const response = await fetch(`/api/proxy/invoices/${orderId}`);

      if (!response.ok) throw new Error('Failed to generate invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber || 'Invoice'}-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to download invoice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Download Invoice
    </Button>
  );
}
