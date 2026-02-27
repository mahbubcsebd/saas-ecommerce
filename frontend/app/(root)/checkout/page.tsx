import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CheckoutPageContent from "@/components/checkout/CheckoutPageContent";
import { api } from "@/lib/api-client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/checkout");
  }

  let initialAddress = null;
  if (session) {
    try {
      const data = await api.get<any[]>("/addresses", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        revalidate: 0
      });
      // Find default address or take the first one
      if (data && data.length > 0) {
        initialAddress = data.find(addr => addr.isDefault) || data[0];
      }
    } catch (error) {
      console.error("Failed to fetch addresses for checkout:", error);
    }
  }

  return (
    <CheckoutPageContent
      session={session}
      initialAddress={initialAddress}
    />
  );
}
