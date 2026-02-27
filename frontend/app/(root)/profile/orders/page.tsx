import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OrderCard from "@/components/profile/OrderCard";
import { api } from "@/lib/api-client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/profile/orders");
  }

  // Currency helper (server-side)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price).replace("BDT", "৳");
  };

  let orders = [];
  try {
    const data = await api.get<any[]>("/orders/my-orders", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      revalidate: 0
    });
    orders = data || [];
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  }

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            You haven&apos;t placed any orders yet.
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} formatPrice={formatPrice} />
          ))
        )}
      </div>
    </div>
  );
}
