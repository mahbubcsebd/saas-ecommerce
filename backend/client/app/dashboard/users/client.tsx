'use client';

import { Download, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Separator } from '@/components/ui/separator';
import { User } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { columns } from './columns';

interface UserClientProps {
  initialData: User[];
}

export const UserClient: React.FC<UserClientProps> = ({ initialData }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    try {
      const token = (session as any)?.accessToken;
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      setExporting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/user/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Customers exported successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export customers');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Users ({initialData.length})
          </h2>
          <p className="text-sm text-muted-foreground">Manage users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => router.push(`/dashboard/users/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </div>
      <Separator />
      <DataTable searchKey="firstName" columns={columns} data={initialData} />
    </>
  );
};
