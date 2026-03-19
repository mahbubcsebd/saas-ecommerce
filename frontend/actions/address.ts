'use server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { api } from '@/lib/api-client';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

export type AddressState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function saveAddressAction(
  prevState: AddressState,
  formData: FormData
): Promise<AddressState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  const id = formData.get('id') as string;
  const isEditing = !!id;

  const data = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    street: formData.get('street'),
    city: formData.get('city'),
    state: formData.get('state'),
    zipCode: formData.get('zipCode'),
    type: formData.get('type'),
    isDefault: formData.get('isDefault') === 'on',
    country: 'Bangladesh',
  };

  try {
    if (isEditing) {
      await api.put(`/addresses/${id}`, data, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
    } else {
      await api.post('/addresses', data, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
    }

    revalidatePath('/profile/address');
    return { success: true, message: `Address ${isEditing ? 'updated' : 'saved'} successfully.` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to save address.' };
  }
}

export async function deleteAddressAction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await api.delete(`/addresses/${id}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    revalidatePath('/profile/address');
    return { success: true, message: 'Address deleted successfully.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to delete address.' };
  }
}
