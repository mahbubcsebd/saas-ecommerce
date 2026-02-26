"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="container py-20 flex flex-col items-center justify-center text-center">
      <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/20 mb-6">
        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
      <p className="text-muted-foreground max-w-[600px] mb-8">
        Thank you for your purchase. You will receive an email confirmation shortly.
      </p>
      <div className="flex gap-4">
        {orderId && (
            <Button variant="outline" asChild>
                <Link href={`/orders/${orderId}/invoice`}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Invoice
                </Link>
            </Button>
        )}
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="container py-20 text-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
