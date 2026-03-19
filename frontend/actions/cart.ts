'use server';

import { api } from '@/lib/api-client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  variantId: z.string().optional(),
  guestId: z.string().min(1, 'Guest ID is required'),
});

export async function addToCartAction(prevState: any, formData: FormData) {
  const result = addToCartSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0].message,
    };
  }

  try {
    const data = await api.post('/cart/add', result.data);

    revalidatePath('/cart');

    return {
      success: true,
      message: 'Added to cart',
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Server error occurred',
    };
  }
}

export async function removeFromCartAction(itemId: string, guestId: string) {
  if (!itemId || !guestId) {
    return { success: false, message: 'Item ID and Guest ID are required' };
  }

  try {
    await api.delete(`/cart/items/${itemId}`);

    revalidatePath('/cart');

    return { success: true, message: 'Item removed' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Server error occurred',
    };
  }
}
