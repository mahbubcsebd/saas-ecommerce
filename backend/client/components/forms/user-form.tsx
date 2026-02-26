'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { createUser, deleteUser, updateUser } from '@/app/actions/user';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User } from '@/lib/api';

// Global Components
import GlobalInput from '@/components/forms/GlobalInput';
import GlobalSelect from '@/components/forms/GlobalSelect';
import { useSession } from 'next-auth/react';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  initialData: User | null;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserRole = (session?.user as any)?.role;

  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Edit user' : 'Create user';
  const description = initialData ? 'Edit a user information' : 'Add a new user';
  const action = initialData ? 'Save changes' : 'Create';

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      email: initialData.email,
      username: initialData.username,
      role: (initialData.role === 'USER' ? 'CUSTOMER' : initialData.role) as UserFormValues['role'] || 'CUSTOMER',
      status: initialData.status || (initialData.isActive ? 'ACTIVE' : 'INACTIVE'),
      phone: initialData.phone || '',
      address: initialData.address || '',
    } : {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      phone: '',
      address: '',
    },
  });

  const { control, handleSubmit, formState: { errors }, reset } = form;

  // Sync initialData with form keys to ensure auto-fill works
  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        username: initialData.username || '',
        role: (initialData.role === 'USER' ? 'CUSTOMER' : initialData.role) as UserFormValues['role'] || 'CUSTOMER',
        status: initialData.status || (initialData.isActive ? 'ACTIVE' : 'INACTIVE'),
        phone: initialData.phone || '',
        address: initialData.address || '',
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      setLoading(true);
      let res;
      if (initialData) {
        res = await updateUser(initialData.id, data);
      } else {
        res = await createUser(data);
      }

      if (res.success) {
        toast.success(res.message);
        router.refresh();
        router.push('/dashboard/users');
      } else {
        toast.error(res.message);
      }
    } catch (error) {
       console.error(error);
       toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      const res = await deleteUser(initialData?.id as string);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
        router.push(`/dashboard/users`);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
       console.error(error);
       toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Filter roles based on current user role
  const allRoles = [
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ADMIN', label: 'Admin' },
    // Super Admin removed as per requirement: no one should create a Super Admin via UI
  ];

  const roleOptions = allRoles.filter(option => {
      // If current user is ADMIN, they can't create ADMIN (only Manager, Staff, Customer)
      if (currentUserRole === 'ADMIN') {
          return !['ADMIN'].includes(option.value);
      }
      // SUPER_ADMIN can create ADMIN, MANAGER, STAFF, CUSTOMER
      if (currentUserRole === 'SUPER_ADMIN') return true;

      return false;
  });

  const statusOptions = [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'SUSPENDED', label: 'Suspended' },
      { value: 'PENDING', label: 'Pending' }
  ];

  return (
    <>
      <div className="flex items-center justify-between">
         {/* ... (existing code) ... */}
         <div>
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
         </div>
           {initialData && (
             <Button
             disabled={loading}
             variant="destructive"
             size="sm"
             onClick={onDelete}
           >
             <Trash className="h-4 w-4" />
           </Button>
         )}
      </div>
      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* ... (existing fields) ... */}
            <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                    <GlobalInput
                        label="First Name"
                        placeholder="John"
                        disabled={loading}
                        error={errors.firstName?.message}
                        {...field}
                    />
                )}
            />
            <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                    <GlobalInput
                        label="Last Name"
                        placeholder="Doe"
                        disabled={loading}
                        error={errors.lastName?.message}
                        {...field}
                    />
                )}
            />
            <Controller
                name="username"
                control={control}
                render={({ field }) => (
                    <GlobalInput
                        label="Username"
                        placeholder="johndoe"
                        disabled={loading}
                        error={errors.username?.message}
                        {...field}
                    />
                )}
            />
            <Controller
                name="email"
                control={control}
                render={({ field }) => (
                    <GlobalInput
                        label="Email"
                        placeholder="john@example.com"
                        type="email"
                        disabled={loading}
                        error={errors.email?.message}
                        {...field}
                    />
                )}
            />

            <Controller
                name="role"
                control={control}
                render={({ field }) => (
                    <GlobalSelect
                        label="Role"
                        options={roleOptions}
                        disabled={loading}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.role?.message}
                        placeholder="Select a role"
                    />
                )}
            />

            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <GlobalSelect
                        label="Status"
                        options={statusOptions}
                        disabled={loading}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.status?.message}
                        placeholder="Select status"
                    />
                )}
            />

            <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                    <GlobalInput
                        label="Phone"
                        placeholder="+1234567890"
                        disabled={loading}
                        error={errors.phone?.message}
                        {...field}
                    />
                )}
            />
            <Controller
                name="address"
                control={control}
                render={({ field }) => (
                    <GlobalInput
                        label="Address"
                        placeholder="123 Main St"
                        disabled={loading}
                        error={errors.address?.message}
                        {...field}
                    />
                )}
            />
        </div>
        <div className="flex justify-end">
            <Button disabled={loading} type="submit">
                {action}
            </Button>
        </div>
      </form>
    </>
  );
};
