'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { User } from '@/lib/api';
import { format } from 'date-fns';
import { CalendarIcon, CreditCard, GlobeIcon, MailIcon, MapPinIcon, PhoneIcon, ShieldIcon, ShoppingBag, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: User | null;
}

export const UserViewModal: React.FC<UserViewModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !data) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive';
      case 'ADMIN':
        return 'default';
      case 'MANAGER':
        return 'secondary';
      case 'STAFF':
        return 'outline';
      case 'CUSTOMER':
        return 'secondary'; // Or a distinct customer color if configured
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Detailed information about this user.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Header with Avatar and Basic Info */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
             <Avatar className="h-24 w-24">
                <AvatarImage src={data.avatar} alt={data.firstName} />
                <AvatarFallback className="text-2xl">{data.firstName?.[0]}{data.lastName?.[0]}</AvatarFallback>
             </Avatar>
             <div className="text-center sm:text-left space-y-1">
                <h3 className="text-2xl font-bold">{data.firstName} {data.lastName}</h3>
                <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                   @{data.username || 'unknown'}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                   <Badge variant={getRoleBadgeColor(data.role) as any}>
                      <ShieldIcon className="w-3 h-3 mr-1" />
                      {data.role}
                   </Badge>
                   <Badge variant={data.isActive ? 'default' : 'destructive'} className={data.isActive ? 'bg-green-600 hover:bg-green-700' : ''}>
                      {data.isActive ? 'Active' : 'Inactive'}
                   </Badge>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             {/* Contact Info */}
             <div className="space-y-3">
                <h4 className="font-semibold text-sm text-foreground/80 border-b pb-1">Contact Information</h4>
                <div className="flex items-center gap-3 text-sm">
                   <MailIcon className="w-4 h-4 text-muted-foreground" />
                   <span>{data.email}</span>
                </div>
                {data.phone && (
                   <div className="flex items-center gap-3 text-sm">
                      <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{data.phone}</span>
                   </div>
                )}
                {data.address && (
                   <div className="flex items-center gap-3 text-sm">
                      <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{data.address}</span>
                   </div>
                )}
                 {data.website && (
                   <div className="flex items-center gap-3 text-sm">
                      <GlobeIcon className="w-4 h-4 text-muted-foreground" />
                      <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[150px]">
                        {data.website}
                      </a>
                   </div>
                )}
             </div>

             {/* Meta Info */}
             <div className="space-y-3">
                 <h4 className="font-semibold text-sm text-foreground/80 border-b pb-1">Account Metadata</h4>
                 <div className="flex items-center gap-3 text-sm">
                   <UserIcon className="w-4 h-4 text-muted-foreground" />
                   <span>ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{data.id.substring(0, 12)}...</code></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                   <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                   <span>Joined: {data.createdAt ? format(new Date(data.createdAt), 'PP') : 'N/A'}</span>
                </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span>Updated: {data.updatedAt ? format(new Date(data.updatedAt), 'PP') : 'N/A'}</span>
                 </div>
              </div>

              {/* Customer Stats */}
              {(data.orderCount !== undefined || data.role === 'CUSTOMER') && (
                 <div className="space-y-3">
                     <h4 className="font-semibold text-sm text-foreground/80 border-b pb-1">Customer Insights</h4>
                     <div className="flex items-center gap-3 text-sm">
                         <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                         <span>Total Orders: <span className="font-bold">{data.orderCount || 0}</span></span>
                     </div>
                     <div className="flex items-center gap-3 text-sm">
                         <CreditCard className="w-4 h-4 text-muted-foreground" />
                         <span>Total Spent: <span className="font-bold text-green-600">৳{(data.totalSpent || 0).toLocaleString()}</span></span>
                     </div>
                 </div>
              )}
           </div>

          {/* Bio Section */}
          {data.bio && (
             <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground/80 border-b pb-1">Bio</h4>
                <p className="text-sm text-muted-foreground italic">
                   "{data.bio}"
                </p>
             </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
