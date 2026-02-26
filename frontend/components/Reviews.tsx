"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/hooks/use-confirm";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function Reviews({ productId }: { productId: string }) {
  const { alert } = useConfirm();
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
        const res = await fetch(`${API_URL}/reviews/${productId}`);
        const data = await res.json();
        if (data.success) {
            setReviews(data.data);
        }
    } catch (error) {
        console.error("Failed to fetch reviews");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
        await alert({
            title: "Join the Conversation",
            message: "Please login to share your thoughts and review this product.",
            type: "info"
        });
        return;
    }

    setSubmitting(true);
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
        const res = await fetch(`${API_URL}/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}` // Assuming session has token
            },
            body: JSON.stringify({ productId, rating, comment })
        });

        if (res.ok) {
            setComment("");
            fetchReviews(); // Refresh
        } else {
            toast.error("Failed to submit review");
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
                      <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                onClick={() => setRating(star)}
                              >
                                ★
                              </button>
                          ))}
                      </div>
                  </div>
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
              </form>
          </div>
      ) : (
          <div className="bg-muted p-4 rounded text-center">
              Please <a href="/auth/login" className="text-primary underline">login</a> to write a review.
          </div>
      )}

      {/* Review List */}
      <div className="space-y-6">
        {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
                <div className="flex items-center gap-4 mb-2">
                    <Avatar>
                        <AvatarImage src={review.user?.avatar} />
                        <AvatarFallback>{review.user?.firstName?.charAt(0) || "U"}</AvatarFallback>
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
                <div className="flex items-center mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-500' : 'text-gray-200'}`}>
                            ★
                        </span>
                    ))}
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
            </div>
        ))}
        {!loading && reviews.length === 0 && (
            <p className="text-muted-foreground italic">No reviews yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
