import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchApi, User } from '@/lib/api';
import { ShieldCheck, Users } from 'lucide-react';
import { RoleDefinitions } from './components/RoleDefinitions';
import { StaffClient } from './components/StaffClient';

export default async function PermissionsPage() {
  let users: User[] = [];

  try {
     const res: any = await fetchApi('/user?limit=200'); // Fetch more to find staff
     users = res.data || [];
  } catch (error) {
     console.error("Failed to fetch users for permissions:", error);
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Permissions & Roles</h2>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Role Definitions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="staff" className="space-y-4">
          <StaffClient initialData={users} />
        </TabsContent>
        <TabsContent value="roles" className="space-y-4">
          <RoleDefinitions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
