"use client";

import { CouponInput } from "@/components/checkout/CouponInput";
import { ShippingOption, ShippingOptions } from "@/components/checkout/ShippingOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/context/TranslationContext";
import { useConfirm } from "@/hooks/use-confirm";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/lib/cart-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Guest Schema
const guestSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Valid phone number required"),
  street: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  zipCode: z.string().min(4, "Zip Code is required"),
});

type GuestFormValues = z.infer<typeof guestSchema>;

export default function CheckoutPage() {
  const { cart, loading: cartLoading, clearCart, guestId } = useCart();
  const { t } = useTranslations();
  const { alert } = useConfirm();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
    }
  }, [status, router]);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // New States for Coupon & Shipping
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
        firstName: "", lastName: "", email: "", phone: "", street: "", city: "", state: "", zipCode: ""
    }
  });

  // Watch for location changes to trigger shipping update
  const country = "BD"; // Default/Fixed for now as per Schema default, or could be dynamic
  const watchedCity = form.watch("city"); // In case we use city for zone logic
  const watchedState = form.watch("state");
  const watchedZip = form.watch("zipCode");

  // Auto-fill form if user is logged in
  useEffect(() => {
     if (session?.user) {
         const nameParts = session.user.name?.split(" ") || ["", ""];
         form.setValue("firstName", nameParts[0] || "");
         form.setValue("lastName", nameParts.slice(1).join(" ") || "");
         form.setValue("email", session.user.email || "");
         form.setValue("phone", session.user.phone || ""); // Assuming phone is extended in session

         // Fetch user address
         const fetchAddress = async () => {
             if (!session?.accessToken) {
                 console.log("No access token available for address fetch");
                 return;
             }
             try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                console.log("Fetching addresses from:", `${API_URL}/addresses`);
                const res = await fetch(`${API_URL}/addresses`, {
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log("Address fetch status:", res.status);
                const data = await res.json();
                console.log("Address data received:", data);
                if (res.ok && data.data && data.data.length > 0) {
                    const defaultAddr = data.data[0]; // Take first as default

                    // Split name if present, otherwise fallback to session name parts
                    const addrNameParts = defaultAddr.name ? defaultAddr.name.split(" ") : nameParts;
                    if (defaultAddr.name) {
                        form.setValue("firstName", addrNameParts[0] || "");
                        form.setValue("lastName", addrNameParts.slice(1).join(" ") || "");
                    }

                    form.setValue("street", defaultAddr.street);
                    form.setValue("city", defaultAddr.city);
                    form.setValue("state", defaultAddr.state || "");
                    form.setValue("zipCode", defaultAddr.zipCode);
                    form.setValue("phone", defaultAddr.phone || session.user.phone || "");
                    form.setValue("email", session.user.email || ""); // Ensure email is set
                }
             } catch (e) {
                 console.error("Failed to fetch address", e);
             }
         }
         fetchAddress();
     }
  }, [session, form]);

  const onSubmit = async (data: GuestFormValues) => {
    setIsSubmitting(true);
    try {
        if (!shippingOption) {
            await alert({
                title: t('common', 'shippingRequired', { defaultValue: 'Shipping Required' }),
                message: t('common', 'selectShippingMethod', { defaultValue: 'Please select a shipping method to proceed.' }),
                type: "warning"
            });
            setIsSubmitting(false);
            return;
        }

        const orderData = {
            sessionId: guestId, // Backend uses sessionId to match Cart schema
            orderItems: cart?.items.map(item => {
                const price = item.variant?.sellingPrice || item.product.sellingPrice;
                return {
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: price
                };
            }),
            guestInfo: {
                name: `${data.firstName} ${data.lastName}`,
                email: data.email,
                phone: data.phone,
            },
            shippingAddress: {
                street: data.street,
                city: data.city,
                state: data.state || "",
                zipCode: data.zipCode,
                country: country
            },
            paymentMethod: "COD",

            // New Fields
            shippingCost: shippingOption.cost,
            shippingMethod: shippingOption.method,
            shippingZoneId: (shippingOption as any).zoneId, // Ensure interface has this or cast
            shippingRateId: shippingOption.id,

            discountAmount: discount,
            appliedCoupon: couponCode
        };

        // Headers need to include token if available
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session?.accessToken) {
            headers["Authorization"] = `Bearer ${session.accessToken}`;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers,
            body: JSON.stringify(orderData)
        });

        const orderResponse = await res.json();

        if (res.ok) {
            clearCart();
            router.push(`/orders/success?orderId=${orderResponse.data.id}`);
        } else {
            console.error("Order failed:", orderResponse);
            toast.error(`${t('common', 'orderFailed', { defaultValue: 'Order failed' })}: ${orderResponse.message || t('common', 'unknownError', { defaultValue: 'Unknown error' })}`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (status === "loading" || cartLoading) return <div>{t('common', 'loadingCart', { defaultValue: 'Loading cart...' })}</div>;
  if (status === "unauthenticated") return null;
  if (!cart || cart.items.length === 0) return <div>{t('common', 'cartEmpty', { defaultValue: 'Cart is empty' })}</div>;

  const subtotal = cart.items.reduce((acc, item) => {
    const price = item.variant?.sellingPrice || item.product.sellingPrice;
    return acc + (price * item.quantity);
  }, 0);

  // Calculate Cart Weight
  // Assuming product has 'weight' field. If not in TS interface, might need casting or update context type.
  const cartWeight = cart.items.reduce((acc, item) => {
      const w = (item.product as any).weight || 0.5; // Default 0.5kg if missing
      return acc + (w * item.quantity);
  }, 0);

  const shippingCost = shippingOption?.cost || 0;
  const total = Math.max(0, subtotal + shippingCost - discount);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">{t('common', 'checkout', { defaultValue: 'Checkout' })}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Checkout Form */}
        <div>
            <div className="mb-6">
                 <h2 className="text-xl font-semibold mb-1">{t('common', 'shippingDetails', { defaultValue: 'Shipping Details' })}</h2>
                 <p className="text-sm text-muted-foreground">{session ? t('common', 'reviewDetails', { defaultValue: 'Review your details' }) : t('common', 'enterShippingInfo', { defaultValue: 'Enter your shipping information' })}</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">{t('common', 'firstName', { defaultValue: 'First Name' })}</Label>
                        <Input id="firstName" {...form.register("firstName")} error={form.formState.errors.firstName?.message as string} />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="lastName">{t('common', 'lastName', { defaultValue: 'Last Name' })}</Label>
                        <Input id="lastName" {...form.register("lastName")} error={form.formState.errors.lastName?.message as string} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">{t('common', 'email', { defaultValue: 'Email' })}</Label>
                    <Input id="email" type="email" {...form.register("email")} error={form.formState.errors.email?.message as string} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">{t('common', 'phone', { defaultValue: 'Phone' })}</Label>
                    <Input id="phone" {...form.register("phone")} error={form.formState.errors.phone?.message as string} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="street">{t('common', 'address', { defaultValue: 'Address' })}</Label>
                    <Input id="street" {...form.register("street")} error={form.formState.errors.street?.message as string} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">{t('common', 'city', { defaultValue: 'City' })}</Label>
                        <Input id="city" {...form.register("city")} error={form.formState.errors.city?.message as string} />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="state">{t('common', 'state', { defaultValue: 'State' })}</Label>
                         <Input id="state" {...form.register("state")} error={form.formState.errors.state?.message as string} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="zipCode">{t('common', 'zipCode', { defaultValue: 'Zip Code' })}</Label>
                        <Input id="zipCode" {...form.register("zipCode")} error={form.formState.errors.zipCode?.message as string} />
                    </div>
                </div>

                {/* Shipping Options */}
                <ShippingOptions
                    cartTotal={subtotal}
                    cartWeight={cartWeight}
                    onSelect={setShippingOption}
                    selectedId={shippingOption?.id}
                />

                <Button type="submit" size="lg" className="w-full mt-6" disabled={isSubmitting}>
                    {isSubmitting ? t('common', 'processing', { defaultValue: 'Processing...' }) : `${t('common', 'placeOrder', { defaultValue: 'Place Order' })} - ${formatPrice(total)}`}
                </Button>
            </form>
        </div>

        {/* Order Review */}
        <div>
             <div className="rounded-lg border bg-card p-6 sticky top-20">
                <h2 className="text-xl font-semibold mb-4">{t('common', 'yourOrder', { defaultValue: 'Your Order' })}</h2>
                <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                    {cart.items.map((item) => {
                        const price = item.variant?.sellingPrice || item.product.sellingPrice;
                        const displayImage = item.variant?.images?.[0] || item.product.images?.[0];
                        return (
                        <div key={item.id} className="flex gap-4 text-sm border-b pb-4 last:border-0 last:pb-0">
                             <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded border bg-muted">
                                {displayImage && (
                                    <Image
                                        src={displayImage}
                                        alt={item.product.name}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                             </div>
                             <div className="font-medium flex-1">
                                <p>{item.product.name}</p>
                                {item.variant && (
                                  <p className="text-[10px] text-muted-foreground leading-tight">
                                    {item.variant.name}
                                  </p>
                                )}
                                <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                             </div>
                             <div className="text-right">
                                <p className="font-semibold">{formatPrice(price * item.quantity)}</p>
                                <p className="text-[10px] text-muted-foreground">{formatPrice(price)} / unit</p>
                             </div>
                        </div>
                        );
                    })}
                </div>

                {/* Coupon Input */}
                <CouponInput
                    cart={{
                        items: cart.items.map(item => ({
                            productId: item.productId,
                            categoryId: (item.product as any).categoryId, // Assuming available or needed
                            price: item.variant?.sellingPrice || item.product.sellingPrice,
                            quantity: item.quantity
                        })),
                        subtotal: subtotal,
                        userId: session?.user?.id || "",
                        country: country
                    }}
                    country={country}
                    onApply={(d, c) => {
                        setDiscount(d);
                        setCouponCode(c);
                    }}
                    onRemove={() => {
                        setDiscount(0);
                        setCouponCode("");
                    }}
                    appliedCoupon={couponCode}
                />

                <div className="border-t pt-4 mt-6 space-y-2">
                    <div className="flex justify-between">
                        <span>{t('common', 'subtotal', { defaultValue: 'Subtotal' })}</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    {shippingOption && (
                        <div className="flex justify-between text-muted-foreground">
                            <span>{t('common', 'shipping', { defaultValue: 'Shipping' })} ({shippingOption.method})</span>
                            <span>{formatPrice(shippingOption.cost)}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>{t('common', 'discount', { defaultValue: 'Discount' })} ({couponCode})</span>
                            <span>-{formatPrice(discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>{t('common', 'total', { defaultValue: 'Total' })}</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
