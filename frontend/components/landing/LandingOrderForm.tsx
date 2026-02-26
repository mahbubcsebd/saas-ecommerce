
"use client";

import { useConfirm } from "@/hooks/use-confirm";
import { CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface LandingOrderFormProps {
  product: {
    id: string;
    name: string;
    sellingPrice: number;
    images: string[];
  };
  offerData?: any; // For countdown or specific offer details
}

export default function LandingOrderForm({ product, offerData }: LandingOrderFormProps) {
  const router = useRouter();
  const { alert } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // Shipping cost logic (Hardcoded for now or use prop)
  const shippingCost = 120;
  const total = product.sellingPrice + shippingCost;

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const orderPayload = {
        source: "ONLINE", // or "FUNNEL" if enum supports
        guestInfo: {
            name: data.name,
            phone: data.phone,
            email: data.email || undefined // Optional
        },
        items: [
            {
                productId: product.id,
                variantId: null, // Basic product for now
                quantity: 1,
                unitPrice: product.sellingPrice,
                total: product.sellingPrice
            }
        ],
        shippingAddress: {
            name: data.name,
            phone: data.phone,
            address: data.address,
            city: data.city || "Dhaka", // Default
            zone: "Dhaka", // Simple default logic
        },
        paymentMethod: "COD",
        subtotal: product.sellingPrice,
        shippingCost: shippingCost,
        total: total,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        setSuccess(true);
        setOrderId(responseData.data.id || responseData.data.orderNumber); // Adjust based on API response
        // Optional: Redirect to success page
        // router.push(`/order-success/${responseData.data.id}`);
      } else {
        toast.error(responseData.message || "Failed to place order");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center animate-in fade-in zoom-in duration-500">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Order Successful!</h2>
        <p className="text-green-700">Thank you for your order.</p>
        {orderId && <p className="text-sm text-green-600 mt-2">Order ID: #{orderId}</p>}
        <p className="mt-4 text-sm text-gray-600">We will call you shortly to confirm.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
      <div className="bg-primary p-4 text-white text-center">
        <h3 className="text-xl font-bold">Order Form</h3>
        <p className="text-primary-foreground/80 text-sm">Cash on Delivery Available</p>
      </div>

      <div className="p-6">
        {/* Product Summary */}
        <div className="flex items-center gap-4 mb-6 border-b pb-4">
            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100 border">
                {product.images?.[0] ? (
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-200" />
                )}
            </div>
            <div className="flex-1">
                <h4 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h4>
                <p className="text-primary font-bold">Tk. {product.sellingPrice}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                    {...register("name", { required: true })}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Your Name"
                />
                {errors.name && <span className="text-xs text-red-500">Name is required</span>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                    {...register("phone", { required: true, pattern: /^[0-9]{11}$/ })}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="01XXXXXXXXX"
                    type="tel"
                />
                {errors.phone && <span className="text-xs text-red-500">Valid phone number is required</span>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                    {...register("address", { required: true })}
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="House, Road, Area, etc."
                    rows={2}
                />
                {errors.address && <span className="text-xs text-red-500">Address is required</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City/District</label>
                    <input
                        {...register("city")}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Dhaka"
                        defaultValue="Dhaka"
                    />
                </div>
                 <div>
                     {/* Placeholder for zone selector if needed */}
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm mt-4">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>Tk. {product.sellingPrice}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Delivery Charge</span>
                    <span>Tk. {shippingCost}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>Tk. {total}</span>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin h-5 w-5" /> Processing...
                    </>
                ) : (
                    "ORDER NOW - Cash On Delivery"
                )}
            </button>

            <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
                 <CheckCircle className="h-3 w-3" /> No advance payment required
            </p>
        </form>
      </div>
    </div>
  );
}
