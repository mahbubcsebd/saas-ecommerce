'use server';

import { fetchApi } from '@/lib/api';
import { revalidatePath } from 'next/cache';

interface ActionResponse {
  success: boolean;
  message: string;
  error?: any;
}

export async function createUser(data: any): Promise<ActionResponse> {
  try {
    const res: any = await fetchApi('/admin/users', {
       method: 'POST',
       body: JSON.stringify(data),
    });
    revalidatePath('/dashboard/users');
    return { success: true, message: 'User created successfully' };
  } catch (error: any) {
    console.error('Create Error:', error);
    return { success: false, message: error.message || 'Failed to create user', error };
  }
}

export async function updateUser(userId: string, data: any): Promise<ActionResponse> {
  try {
    await fetchApi(`/user/${userId}`, {
       method: 'PATCH',
       body: JSON.stringify(data),
    });
    revalidatePath(`/dashboard/users`);
    revalidatePath(`/dashboard/users/${userId}`);
    return { success: true, message: 'User updated successfully' };
  } catch (error: any) {
    console.error('Update Error:', error);
    return { success: false, message: error.message || 'Failed to update user', error };
  }
}

export async function deleteUser(userId: string): Promise<ActionResponse> {
  try {
    await fetchApi(`/user/${userId}`, {
       method: 'DELETE',
    });
    revalidatePath('/dashboard/users');
    return { success: true, message: 'User deleted successfully' };
  } catch (error: any) {
     console.error('Delete Error:', error);
     return { success: false, message: error.message || 'Failed to delete user', error };
  }
}
