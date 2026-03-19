'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/hooks/use-confirm';
import { Rating } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import { Camera, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  images?: string[];
  createdAt: string;
}

export default function Reviews({ productId }: { productId: string }) {
  const { alert } = useConfirm();
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > 3) {
        toast.error('You can only upload up to 3 images.');
        return;
      }
      setImages((prev) => [...prev, ...acceptedFiles]);
    },
    [images]
  );

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 3 - images.length,
    disabled: images.length >= 3,
  });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${API_URL}/reviews/${productId}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      await alert({
        title: 'Join the Conversation',
        message: 'Please login to share your thoughts and review this product.',
        type: 'info',
      });
      return;
    }

    setSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', rating.toString());
      formData.append('comment', comment);
      images.forEach((image) => {
        formData.append('reviews', image); // matches fieldname in anyImageUpload('reviews')
      });

      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`, // Assuming session has token
        },
        body: formData,
      });

      if (res.ok) {
        setComment('');
        setRating(5);
        setImages([]);
        toast.success('Review submitted successfully');
        fetchReviews(); // Refresh
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold">Customer Reviews ({reviews.length})</h3>

      {/* Write Review */}
      {session ? (
        <div className="bg-muted/30 p-6 rounded-lg border space-y-4">
          <h4 className="font-semibold">Write a Review</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rating:</span>
              <div className="w-32">
                <Rating value={rating} onChange={setRating} isRequired />
              </div>
            </div>
            <Textarea
              placeholder="Share your thoughts..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />

            {/* Image Upload Dropzone */}
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
              >
                <input {...getInputProps()} />
                <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop the images here...'
                    : 'Drag & drop some images here, or click to select'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to 3 images perfectly showing your experience.
                </p>
              </div>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {images.map((file, index) => (
                    <div
                      key={index}
                      className="relative h-20 w-20 rounded-md overflow-hidden border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/75 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="bg-muted p-4 rounded text-center">
          Please{' '}
          <a href="/auth/login" className="text-primary underline">
            login
          </a>{' '}
          to write a review.
        </div>
      )}

      {/* Review List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-6">
            <div className="flex items-center gap-4 mb-2">
              <Avatar>
                <AvatarImage src={review.user?.avatar} />
                <AvatarFallback>{review.user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">
                  {review.user?.firstName} {review.user?.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center mb-2 w-24">
              <Rating value={review.rating} readOnly />
            </div>
            <p className="text-muted-foreground mb-4">{review.comment}</p>
            {review.images && review.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {review.images.map((img, i) => (
                  <div key={i} className="relative h-24 w-24 rounded-lg overflow-hidden border">
                    <Image src={img} alt="Review image" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {!loading && reviews.length === 0 && (
          <p className="text-muted-foreground italic">No reviews yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
