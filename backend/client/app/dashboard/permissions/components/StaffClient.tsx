'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { User } from '@/lib/api';
import { Loader2, Search, ShieldAlert, ShieldCheck, ShieldEllipsis, User as UserIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface StaffClientProps {
  initialData: User[];
}

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'STAFFER'];

export const StaffClient: React.FC<StaffClientProps> = ({ initialData }) => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const currentUser = session?.user as any;

  // Filter staff by default, but allow searching all users
  const filteredUsers = users.filter((user) => {
    const isStaff = STAFF_ROLES.includes(user.role);
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    // If searching, show any match. If not, only show staff.
    return searchTerm ? matchesSearch : (isStaff && matchesSearch);
  });

  const onRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingId(userId);
      const token = (session as any)?.accessToken;
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

      const res = await fetch(`${BACKEND_URL}/user/${userId}/role`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => u.id === userId ? { ...u, role: newRole as any } : u)
        );
        toast.success(`Role updated successfully to ${newRole}`);
      }
    } catch (error: any) {
      console.error('Role update error:', error);
      toast.error(error.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> SUPER ADMIN</Badge>;
      case 'ADMIN': return <Badge variant="default" className="bg-blue-600 gap-1"><ShieldCheck className="h-3 w-3" /> ADMIN</Badge>;
      case 'MANAGER': return <Badge variant="outline" className="border-purple-600 text-purple-600 gap-1"><ShieldEllipsis className="h-3 w-3" /> MANAGER</Badge>;
      case 'STAFF':
      case 'STAFFER': return <Badge variant="outline" className="border-green-600 text-green-600 gap-1"><UserIcon className="h-3 w-3" /> STAFF</Badge>;
      default: return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff or customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">Staff Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead className="text-right">Assign New Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {searchTerm ? "No users found matching your search." : "No staff members found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user.firstName} {user.lastName}</span>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {updatingId === user.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      <Select
                        defaultValue={user.role}
                        onValueChange={(val) => onRoleChange(user.id, val)}
                        disabled={updatingId === user.id || (user.role === 'SUPER_ADMIN' && currentUser?.role !== 'SUPER_ADMIN')}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUSTOMER">Customer</SelectItem>
                          <SelectItem value="STAFF">Staff</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {searchTerm && (
        <p className="text-xs text-muted-foreground px-2 italic">
          * Showing all matching users (including customers) to allow promotion to staff roles.
        </p>
      )}
    </div>
  );
};
