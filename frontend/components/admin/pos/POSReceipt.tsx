"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { format } from "date-fns";
import { forwardRef } from "react";

interface POSReceiptProps {
  order: any;
  settings?: any; // Global settings like sitename, address etc
}

export const POSReceipt = forwardRef<HTMLDivElement, POSReceiptProps>(
  ({ order, settings }, ref) => {
    if (!order) return null;

    const {
        orderNumber,
        invoiceNumber, // New Invoice Number
        createdAt,
        items,
        subtotal,
        discountAmount,
        vatAmount,
        total,
        tenderedAmount,
        changeAmount,
        walkInName,
        walkInPhone,
        user
    } = order;
    const { formatPrice } = useCurrency();

    return (
      <div ref={ref} className="w-[80mm] p-2 text-xs font-mono bg-white text-black leading-tight" id="invoice-section">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-lg font-bold uppercase">{settings?.siteName || "MAHUB SHOP"}</h1>
          <p className="text-[10px]">{settings?.address || "Dhaka, Bangladesh"}</p>
          <p className="text-[10px]">{settings?.phone || "Phone: 017xxxxxxxx"}</p>
        </div>

        {/* Info */}
        <div className="mb-2 border-b border-dashed pb-2 space-y-0.5">
           <div className="flex justify-between">
              <span>Date:</span>
              <span>{format(new Date(createdAt), "dd/MM/yy HH:mm")}</span>
           </div>
           <div className="flex justify-between font-semibold">
              <span>Inv #:</span>
              <span>{invoiceNumber || orderNumber}</span>
           </div>
           {user ? (
               <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{user.firstName} {user.lastName}</span>
               </div>
           ) : walkInName ? (
               <div className="flex justify-between">
                  <span>Guest:</span>
                  <span>{walkInName} {walkInPhone ? `(${walkInPhone})` : ''}</span>
               </div>
           ) : null}
        </div>

        {/* Items Table */}
        <table className="w-full mb-2">
            <thead>
                <tr className="border-b border-dashed">
                    <th className="text-left py-1 w-[45%]">Item</th>
                    <th className="text-center py-1 w-[15%]">Qty</th>
                    <th className="text-right py-1 w-[20%]">Price</th>
                    <th className="text-right py-1 w-[20%]">Total</th>
                </tr>
            </thead>
            <tbody>
                {items?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-dotted last:border-0">
                        <td className="py-1 pr-1">
                            <div className="font-semibold">{item.name}</div>
                            {item.variant && <div className="text-[9px] text-gray-600">{item.variant.name}</div>}
                            {item.warranty && <div className="text-[9px] italic">War: {item.warranty}</div>}
                        </td>
                        <td className="text-center align-top py-1">{item.quantity}</td>
                        <td className="text-right align-top py-1">{formatPrice(item.salePrice || 0)}</td>
                        <td className="text-right align-top py-1">{formatPrice(item.total || 0)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-dashed pt-2 space-y-1">
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal || 0)}</span>
            </div>
            {discountAmount > 0 && (
                <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{formatPrice(discountAmount)}</span>
                </div>
            )}
            {vatAmount > 0 && (
                <div className="flex justify-between">
                    <span>VAT:</span>
                    <span>+{formatPrice(vatAmount)}</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-dashed pt-1 mt-1">
                <span>TOTAL:</span>
                <span>{formatPrice(total || 0)}</span>
            </div>

            {tenderedAmount && (
                 <>
                    <div className="flex justify-between mt-2 text-[11px]">
                        <span>Paid (Cash):</span>
                        <span>{formatPrice(tenderedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                        <span>Change:</span>
                        <span>{formatPrice(changeAmount || 0)}</span>
                    </div>
                 </>
            )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 border-t border-dashed pt-2 space-y-1">
            <p className="font-semibold">Thank you!</p>
            <p className="text-[10px]">No return without receipt.</p>
            <p className="text-[10px] mt-1 text-gray-400">Powered by Antigravity POS</p>
        </div>
      </div>
    );
  }
);

POSReceipt.displayName = "POSReceipt";
