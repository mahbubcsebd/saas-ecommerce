import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { GlobalDatePicker } from "@/components/forms/GlobalDatePicker";
import { PlusCircle, Star, Check, ChevronsUpDown, Upload, X, Image as ImageIcon, Loader2, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateCustomReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Product {
  id: string;
  name: string;
  images: string[];
}

export function CreateCustomReviewModal({
  isOpen,
  onClose,
  onCreated,
}: CreateCustomReviewModalProps) {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  
  // Review Images
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isImagesUploading, setIsImagesUploading] = useState(false);

  const [comment, setComment] = useState("");
  const [reviewDate, setReviewDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (isOpen && session?.accessToken) {
      const fetchProducts = async () => {
        try {
          const res = await fetch(`${API_URL}/products?limit=100&status=all`, {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            const productsList = data.data || data;
            if (Array.isArray(productsList)) {
              setProducts(productsList);
            }
          }
        } catch (error) {
          console.error("Failed to fetch products:", error);
        }
      };
      fetchProducts();
    }
  }, [isOpen, session, API_URL]);

  // Upload helper
  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      // Changed to 'image' key to align perfectly with the standard multer configs
      formData.append("image", file);

      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        return result.data?.[0]?.url || null;
      } else {
        const errorData = await res.json();
        console.error("Upload failed server-side:", errorData);
      }
      return null;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAvatarUploading(true);
    try {
      const uploadedUrl = await handleImageUpload(file);
      if (uploadedUrl) {
        setAvatar(uploadedUrl);
        toast.success("Avatar uploaded successfully");
      } else {
        toast.error("Upload failed. Your session might be expired, try logging in again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error uploading avatar");
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleReviewImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (reviewImages.length + files.length > 3) {
      toast.error("You can upload a maximum of 3 review images.");
      return;
    }

    setIsImagesUploading(true);
    try {
      const uploadPromises = files.map((file) => handleImageUpload(file));
      const results = await Promise.all(uploadPromises);
      const successfulUrls = results.filter((url): url is string => !!url);

      if (successfulUrls.length > 0) {
        setReviewImages((prev) => [...prev, ...successfulUrls]);
        toast.success(`Successfully uploaded ${successfulUrls.length} image(s)`);
      } else {
        toast.error("Upload failed. Your session might be expired, try logging in again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error uploading review images");
    } finally {
      setIsImagesUploading(false);
    }
  };

  const removeReviewImage = (indexToRemove: number) => {
    setReviewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    if (!firstName || !lastName || !email) {
      toast.error("First Name, Last Name, and Email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/reviews/admin/custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          productId: selectedProductId,
          rating,
          comment,
          firstName,
          lastName,
          email,
          avatar: avatar || null,
          createdAt: reviewDate ? reviewDate.toISOString() : null,
          images: reviewImages,
        }),
      });

      if (res.ok) {
        toast.success("Custom review created successfully!");
        onCreated();
        onClose();
        // Reset fields
        setSelectedProductId("");
        setRating(5);
        setFirstName("");
        setLastName("");
        setEmail("");
        setAvatar("");
        setReviewImages([]);
        setComment("");
        setReviewDate(null);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to create custom review");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-900">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-950 dark:text-zinc-50">
            <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Create Custom Review
          </DialogTitle>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Write and publish custom approved reviews directly for any product with attachments.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Combobox Product Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider block">
              Select Product *
            </label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between font-normal text-left h-11 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 bg-white dark:bg-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer"
                >
                  {selectedProductId
                    ? products.find((p) => p.id === selectedProductId)?.name
                    : "Search or select a product..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-xl rounded-xl overflow-hidden z-[9999]" align="start">
                <Command className="w-full dark:bg-zinc-900">
                  <CommandInput placeholder="Search product name..." className="border-none focus:ring-0 focus:outline-none px-3 py-2 text-sm dark:bg-zinc-900 dark:text-zinc-100" />
                  <CommandList className="max-h-[220px] overflow-y-auto p-1">
                    <CommandEmpty className="p-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      No products found.
                    </CommandEmpty>
                    <CommandGroup>
                      {products.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            setSelectedProductId(p.id);
                            setPopoverOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                            selectedProductId === p.id && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium"
                          )}
                        >
                          <span className="truncate pr-4">{p.name}</span>
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400",
                              selectedProductId === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedProductId && (
              <div className="flex items-center gap-2 mt-1.5 p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/50 rounded-lg">
                {products.find((p) => p.id === selectedProductId)?.images?.[0] && (
                  <Image
                    src={products.find((p) => p.id === selectedProductId)!.images[0]}
                    alt="Selected Product"
                    width={32}
                    height={32}
                    className="rounded object-cover border"
                  />
                )}
                <span className="text-xs font-medium text-indigo-900 dark:text-indigo-300">
                  Selected: {products.find((p) => p.id === selectedProductId)?.name}
                </span>
              </div>
            )}
          </div>

          <hr className="border-gray-100 dark:border-zinc-800" />

          {/* Customer & Avatar Section */}
          <div className="space-y-4">
            <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider block">
              Reviewer Details
            </label>
            
            {/* Avatar Uploader UI */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-zinc-50/40 dark:bg-zinc-800/10 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl">
              <div className="relative group/avatar cursor-pointer shrink-0" onClick={() => avatarInputRef.current?.click()}>
                <div className={cn(
                  "w-16 h-16 rounded-full border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden relative transition-all shadow-sm group-hover/avatar:border-indigo-500 group-hover/avatar:shadow-md",
                  isAvatarUploading && "opacity-50"
                )}>
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt="Reviewer Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <User className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                    </div>
                  )}
                  {isAvatarUploading && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    </div>
                  )}
                </div>
                
                {/* Camera Overlay on Hover */}
                {!isAvatarUploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 block">Reviewer Avatar Photo</span>
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isAvatarUploading}
                    className="gap-1.5 cursor-pointer text-xs rounded-xl hover:bg-indigo-50/50 hover:text-indigo-600 dark:hover:bg-zinc-800 dark:hover:text-indigo-400 h-8"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload New Avatar
                  </Button>
                  {avatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatar("")}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs rounded-xl h-8 cursor-pointer"
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 block">
                  PNG, JPG or WEBP. Upload a professional headshot.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 dark:text-zinc-400">First Name *</span>
                <input
                  type="text"
                  placeholder=" Sarah"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 dark:text-zinc-400">Last Name *</span>
                <input
                  type="text"
                  placeholder=" Connor"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Email Address *</span>
              <input
                type="email"
                placeholder=" sarah.connor@example.com"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-zinc-800" />

          {/* Star Rating & Custom Date Picker */}
          <div className="grid grid-cols-12 gap-6">
            <div className="space-y-2 col-span-4">
              <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider block">
                Rating Stars *
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none transform hover:scale-110 transition-transform cursor-pointer"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-5 h-5 ${star <= (hoverRating ?? rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300 dark:text-zinc-600"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Global Date Picker */}
            <div className="w-full col-span-8">
              <GlobalDatePicker
                label="Review Date (optional)"
                value={reviewDate}
                onChange={setReviewDate}
                placeholder="Choose custom review date..."
                className="w-full"
                showTimeSelect={true}
              />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-zinc-800" />

          {/* Review Image Attachments */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider block">
              Review Images (optional, max 3)
            </span>
            <input
              type="file"
              ref={imagesInputRef}
              onChange={handleReviewImagesChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <div 
              onClick={() => reviewImages.length < 3 && imagesInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all bg-zinc-50/30 hover:bg-zinc-50/70 dark:bg-zinc-800/5 dark:hover:bg-zinc-800/10",
                reviewImages.length < 3 ? "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500/50" : "border-zinc-200 dark:border-zinc-800 opacity-60 cursor-default",
                isImagesUploading && "border-indigo-400 bg-indigo-50/5 dark:bg-zinc-800/10 pointer-events-none"
              )}
            >
              {isImagesUploading ? (
                <div className="space-y-2 flex flex-col items-center">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                  <p className="text-xs text-indigo-600 font-medium">Uploading attachment files to Cloudinary...</p>
                </div>
              ) : reviewImages.length === 0 ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Upload review image attachments
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                      Drag and drop up to 3 images, or <span className="text-indigo-600 dark:text-indigo-400 underline font-medium">browse files</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Attached Images ({reviewImages.length}/3)
                  </p>
                  <div className="flex flex-wrap justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {reviewImages.map((img, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border bg-white dark:bg-zinc-800 shadow-sm shrink-0 group/img">
                        <Image src={img} alt={`Attachment ${index + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeReviewImage(index)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {reviewImages.length < 3 && (
                      <button
                        type="button"
                        onClick={() => imagesInputRef.current?.click()}
                        className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:border-indigo-500/50 transition-all text-zinc-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 cursor-pointer"
                      >
                        <PlusCircle className="w-5 h-5 mb-1" />
                        <span className="text-[8px] font-bold uppercase">Add More</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider block">
              Review Comment
            </label>
            <textarea
              placeholder="What did this customer say about the product?"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 min-h-[100px] text-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isAvatarUploading || isImagesUploading}
              className="px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
            >
              {isSubmitting ? "Publishing..." : "Publish Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
