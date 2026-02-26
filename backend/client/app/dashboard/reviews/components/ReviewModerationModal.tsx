import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { CheckCircle, MessageCircle, ShieldAlert, Trash2, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Review } from "../page";

interface ReviewModerationModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ReviewModerationModal({
  review,
  isOpen,
  onClose,
  onUpdate,
}: ReviewModerationModalProps) {
  const { alert, confirm } = useConfirm();
  const { data: session } = useSession();
  const [adminReply, setAdminReply] = useState(review.adminReply || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  const updateStatus = async (status: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_URL}/reviews/admin/${review.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        onUpdate();
        if (status !== review.status) {
             onClose(); // Optional: close on status change or keep open to allow reply
        }
      } else {
        await alert({
            title: "Update Failed",
            message: "Failed to update review status.",
            type: "warning"
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleFlag = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_URL}/reviews/admin/${review.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ isFlagged: !review.isFlagged }),
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const submitReply = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_URL}/reviews/admin/${review.id}/reply`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ adminReply }),
      });

      if (res.ok) {
        onUpdate();
        toast.success("Reply saved successfully.");
      } else {
        toast.error("Failed to save reply");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteReview = async () => {
    if (!await confirm({
        title: "Delete Review",
        message: "Are you sure you want to completely delete this review? This action cannot be undone.",
        type: "danger",
        confirmText: "Delete Review"
    })) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`${API_URL}/reviews/admin/${review.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        onUpdate();
        onClose();
      } else {
        toast.error("Failed to delete review");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl font-semibold">Review Details</DialogTitle>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                  statusColors[review.status]
                }`}
              >
                {review.status}
              </span>
              <Button
                variant="outline"
                size="sm"
                className={`h-7 px-2 text-xs ${review.isFlagged ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200" : "text-gray-500"}`}
                onClick={toggleFlag}
                disabled={isUpdating}
              >
                <ShieldAlert className="w-3 h-3 mr-1" />
                {review.isFlagged ? "Flagged" : "Flag"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Customer & Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</h3>
              <div className="flex items-center gap-3">
                {review.user.avatar ? (
                  <Image
                    src={review.user.avatar}
                    alt={`${review.user.firstName} ${review.user.lastName}`}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {review.user.firstName.charAt(0)}
                    {review.user.lastName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">
                    {review.user.firstName} {review.user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{review.user.email}</div>
                </div>
              </div>
            </div>

            {/* Product Box */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Product</h3>
              <div className="flex items-center gap-3">
                {review.product.images?.[0] ? (
                  <Image
                    src={review.product.images[0]}
                    alt={review.product.name}
                    width={40}
                    height={40}
                    className="rounded border object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded border bg-gray-200 flex items-center justify-center text-gray-400">
                    N/A
                  </div>
                )}
                <div className="font-medium text-gray-900 line-clamp-2">
                  {review.product.name}
                </div>
              </div>
            </div>
          </div>

          {/* Review Content */}
          <div className="border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= review.rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{review.comment || <span className="italic text-gray-400">No comment provided.</span>}</p>
          </div>

          {/* Admin Reply */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              Public Admin Reply
            </label>
            <textarea
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px] resize-y"
              placeholder="Write a public response to this review..."
              value={adminReply}
              onChange={(e) => setAdminReply(e.target.value)}
            />
            <div className="flex justify-end">
               <Button
                variant="outline"
                size="sm"
                onClick={submitReply}
                disabled={isUpdating || adminReply === (review.adminReply || "")}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              >
                Save Reply
               </Button>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-gray-50 p-4 border-t flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={deleteReview}
              disabled={isUpdating}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Review
            </Button>

            <div className="flex gap-3">
              {review.status !== "APPROVED" && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updateStatus("APPROVED")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              )}
              {review.status !== "REJECTED" && (
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => updateStatus("REJECTED")}
                  disabled={isUpdating}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
