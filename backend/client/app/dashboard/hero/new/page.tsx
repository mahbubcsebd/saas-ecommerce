'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BannerForm } from '@/components/dashboard/hero/BannerForm';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const HERO_API = `${API_BASE}/hero-slides`;

export default function NewHeroSlidePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || '';
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form: any) => {
    if (form.imageFiles.length === 0) {
      return toast.error('At least one image is required');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      form.imageFiles.forEach((file: any) => formData.append('images', file));
      
      formData.append(
        'metadata',
        JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          linkType: form.linkType,
          linkValue: form.linkValue,
          isActive: form.isActive,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      );

      const res = await fetch(`${HERO_API}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Banners created successfully');
        router.push('/dashboard/hero');
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to create banners');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50/30 min-h-screen">
      <BannerForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
