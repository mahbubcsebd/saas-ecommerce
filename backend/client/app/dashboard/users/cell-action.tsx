'use client';

import { Copy, Edit, Eye, Mail, MoreHorizontal, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { UserViewModal } from '@/components/dashboard/users/user-view-modal'; // Import View Modal
import { AlertModal } from '@/components/modals/alert-modal';
import { SendEmailModal } from '@/components/modals/SendEmailModal';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { deleteUser } from '@/app/actions/user';
import { User } from '@/lib/api';

interface CellActionProps {
  data: User;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false); // State for View Modal
  const [emailOpen, setEmailOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    try {
      setLoading(true);
      const res = await deleteUser(data.id);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
       console.error(error);
       toast.error('Something went wrong.');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <UserViewModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        data={data}
      />
      <SendEmailModal
        isOpen={emailOpen}
        onClose={() => setEmailOpen(false)}
        user={data}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setViewOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" /> View Info
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setEmailOpen(true)}
          >
            <Mail className="mr-2 h-4 w-4" /> Send Email
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/users/${data.id}`)}
          >
            <Edit className="mr-2 h-4 w-4" /> View Details & Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(data.id)}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
