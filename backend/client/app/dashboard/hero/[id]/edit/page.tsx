'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { BannerForm } from '@/components/dashboard/hero/BannerForm';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const HERO_API = `${API_BASE}/hero-slides`;

export default function EditHeroSlidePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || '';

  const [slide, setSlide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token && id) {
      fetchSlide();
    }
  }, [token, id]);

  const fetchSlide = async () => {
    try {
      const res = await fetch(`${HERO_API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSlide(data.data);
      } else {
        toast.error('Slide not found');
        router.push('/dashboard/hero');
      }
    } catch {
      toast.error('Failed to load slide');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (form: any) => {
    setSaving(true);
    try {
      // If new image was picked, we might need a different endpoint or FormData
      // But typically Edit only updates metadata if no new image, or we might need a multipart if new image

      let res;
      if (form.imageFiles.length > 0) {
        // Update with NEW image
        const formData = new FormData();
        formData.append('images', form.imageFiles[0]); // Backend might expect 'image' or 'images'
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

        res = await fetch(`${HERO_API}/${id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        // Update metadata ONLY
        const payload = {
          title: form.title,
          subtitle: form.subtitle,
          linkType: form.linkType,
          linkValue: form.linkValue,
          isActive: form.isActive,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        };

        res = await fetch(`${HERO_API}/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        toast.success('Banner updated successfully');
        router.push('/dashboard/hero');
        router.refresh();
      } else {
        toast.error(data.message || 'Failed to update banner');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An error occurred while updating');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50/30">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-gray-50/30 min-h-screen">
      <BannerForm
        initialData={slide}
        onSubmit={handleSubmit}
        isEditing={true}
        loading={saving}
      />
    </div>
  );
}
