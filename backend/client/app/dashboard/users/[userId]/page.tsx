import { UserOrderHistory } from '@/components/dashboard/users/UserOrderHistory';
import { UserForm } from '@/components/forms/user-form';
import { Separator } from '@/components/ui/separator';
import { fetchApi, User } from '@/lib/api';

export default async function UserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  // If "new", render empty form
  if (userId === 'new') {
    return (
       <div className="flex-1 space-y-4 p-8 pt-6">
         <UserForm initialData={null} />
       </div>
    );
  }

  let user: User | null = null;
  let orders: any[] = [];

  if (userId && userId !== 'undefined') {
    try {
      const [userRes, ordersRes]: any = await Promise.all([
          fetchApi(`/user/${userId}`),
          fetchApi(`/orders/admin/all?userId=${userId}&limit=10`) // Fetch recent 10 orders
      ]);

      if (userRes.success) {
          user = userRes.data;
      }

      if (ordersRes.success) {
          orders = ordersRes.data;
      }
    } catch (error) {
      console.error("Failed to fetch user or orders", error);
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <UserForm initialData={user} />

      {user && (user.role === 'CUSTOMER' || (user as any).role === 'USER') && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Order History</h3>
            <p className="text-sm text-muted-foreground">
              Recent orders placed by this customer.
            </p>
          </div>
          <Separator />
          <UserOrderHistory orders={orders} />
        </div>
      )}
    </div>
  );
}
