'use server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { api } from '@/lib/api-client';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

export type ProfileState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  user?: any;
};

export async function updateProfileAction(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      success: false,
      message: 'You must be logged in to update your profile.',
    };
  }

  try {
    // We pass FormData directly if the API supports it,
    // or we transform it if needed. The current Profile page uses fetch with FormData.
    const res = await api.put<any>('/user/profile', formData, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    revalidatePath('/profile');
    revalidatePath('/profile/edit');

    return {
      success: true,
      message: 'Profile updated successfully.',
      user: res, // Return the updated user object
    };
  } catch (error: any) {
    console.error('Profile Update Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to update profile. Please try again.',
    };
  }
}

export async function changePasswordAction(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      success: false,
      message: 'You must be logged in to change your password.',
    };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, message: 'All password fields are required.' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: 'New passwords do not match.' };
  }

  try {
    const res = await api.post<any>(
      '/auth/change-password',
      {
        currentPassword,
        newPassword,
        confirmPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  } catch (error: any) {
    console.error('Change Password Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to change password. Please verify your current password.',
    };
  }
}
