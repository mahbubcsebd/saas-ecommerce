import { fetchApi, User } from '@/lib/api';
import { UserClient } from './client';

export default async function UsersPage() {
  let users: User[] = [];

  try {
     const res: any = await fetchApi('/user?limit=100');
     console.log('User Fetch Success:', res);
     users = res.data || [];
  } catch (error) {
     console.error("Failed to fetch users:", error);
     // In a real app, handle error UI
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <UserClient initialData={users} />
    </div>
  );
}
