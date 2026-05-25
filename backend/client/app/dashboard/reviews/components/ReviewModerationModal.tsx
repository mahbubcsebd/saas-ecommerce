import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { CheckCircle, MessageCircle, ShieldAlert, Trash2, XCircle, Info, Calendar, User, ShoppingBag } from "lucide-react";
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
        toast.success(`Review ${status.toLowerCase()} successfully.`);
        if (status !== review.status) {
          onClose();
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
    const newFlaggedState = !review.isFlagged;
    try {
      const res = await fetch(`${API_URL}/reviews/admin/${review.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ isFlagged: newFlaggedState }),
      });

      if (res.ok) {
        onUpdate();
        toast.success(newFlaggedState ? "Review flagged as suspicious" : "Review unflagged");
        onClose(); // close to refresh state
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
        toast.success("Admin reply saved successfully.");
        onClose();
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
        toast.success("Review deleted successfully.");
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
    PENDING: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-zinc-100/50 dark:from-zinc-900 dark:to-zinc-900/50">
          <div className="flex justify-between items-center pr-6">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-zinc-50">Review Details</DialogTitle>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${statusColors[review.status]}`}
              >
                {review.status}
              </span>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all ${review.isFlagged
                    ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                    : "text-gray-500 border-gray-200 hover:bg-gray-50 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                onClick={toggleFlag}
                disabled={isUpdating}
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                {review.isFlagged ? "Flagged" : "Flag"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Customer & Product Info Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-indigo-100 dark:hover:border-zinc-700 transition-colors">
              <h3 className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <User className="w-3 h-3 text-indigo-500" />
                Customer Info
              </h3>
              <div className="flex items-center gap-3">
                {review.user.avatar ? (
                  <Image
                    src={review.user.avatar}
                    alt={`${review.user.firstName} ${review.user.lastName}`}
                    width={44}
                    height={44}
                    className="rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-sm"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shadow-sm border border-indigo-100/30 dark:border-zinc-700">
                    {review.user.firstName.charAt(0)}
                    {review.user.lastName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-zinc-100 text-sm truncate">
                    {review.user.firstName} {review.user.lastName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400 truncate">{review.user.email}</div>
                </div>
              </div>
            </div>

            {/* Product Box */}
            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-indigo-100 dark:hover:border-zinc-700 transition-colors">
              <h3 className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ShoppingBag className="w-3 h-3 text-emerald-500" />
                Product Details
              </h3>
              <div className="flex items-center gap-3">
                {review.product.images?.[0] ? (
                  <Image
                    src={review.product.images[0]}
                    alt={review.product.name}
                    width={44}
                    height={44}
                    className="rounded-lg border object-cover shadow-sm bg-white dark:bg-zinc-800"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg border bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 text-xs">
                    N/A
                  </div>
                )}
                <div className="font-medium text-gray-900 dark:text-zinc-100 text-sm line-clamp-2 leading-tight">
                  {review.product.name}
                </div>
              </div>
            </div>
          </div>

          {/* Review Content Card */}
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 bg-gradient-to-tr from-white to-zinc-50/30 dark:from-zinc-900 dark:to-zinc-900/50 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= review.rating ? "text-amber-400" : "text-zinc-200 dark:text-zinc-700"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(review.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-800 dark:text-zinc-200 text-sm whitespace-pre-wrap leading-relaxed font-normal">
              {review.comment || <span className="italic text-gray-400 dark:text-zinc-500">No review text was provided by the customer.</span>}
            </p>
          </div>

          {/* Admin Reply Input Area */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
              <MessageCircle className="w-4 h-4 text-indigo-500" />
              Public Admin Reply
            </label>
            <textarea
              className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 min-h-[90px] resize-y"
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
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700 cursor-pointer text-xs px-4"
              >
                Save Reply
              </Button>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer font-medium"
            onClick={deleteReview}
            disabled={isUpdating}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Review
          </Button>

          <div className="flex gap-2">
            {review.status !== "APPROVED" && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer shadow-sm shadow-emerald-100 dark:shadow-none"
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
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-rose-400 dark:border-rose-950/20 dark:border-rose-900/30 cursor-pointer font-medium"
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
