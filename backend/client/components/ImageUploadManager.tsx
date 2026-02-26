"use client";

import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface ImageItem {
  file?: File;
  url: string;
  id: string;
  isPrimary?: boolean;
}

interface ImageUploadManagerProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  variantLabel?: string; // e.g., "Red" or "Main Product"
  maxImages?: number;
}

function SortableImage({ image, onDelete, onSetPrimary, isPrimary }: {
  image: ImageItem;
  onDelete: () => void;
  onSetPrimary: () => void;
  isPrimary: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white rounded-lg border-2 overflow-hidden ${
        isPrimary ? "border-orange-500 ring-2 ring-orange-200" : "border-gray-200"
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm rounded p-1.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <GripVertical size={18} className="text-gray-600" />
      </div>

      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
          <Star size={12} fill="white" />
          Primary
        </div>
      )}

      {/* Image */}
      <div className="aspect-square relative">
        <Image
          src={image.url}
          alt="Product"
          fill
          className="object-cover"
        />
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1 justify-end">
          {!isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded transition-colors"
              title="Set as primary"
            >
              <Star size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="bg-red-500/90 hover:bg-red-500 text-white p-1.5 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImageUploadManager({
  images,
  onChange,
  variantLabel = "Main Product",
  maxImages = 10,
}: ImageUploadManagerProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = maxImages - images.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    const newImages: ImageItem[] = filesToAdd.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random()}`,
      isPrimary: images.length === 0, // First image is primary by default
    }));

    onChange([...images, ...newImages]);
  }, [images, maxImages, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    disabled: images.length >= maxImages,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleDelete = (id: string) => {
    const deletedImage = images.find((img) => img.id === id);
    const newImages = images.filter((img) => img.id !== id);

    // If deleted image was primary, make first image primary
    if (deletedImage?.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    onChange(newImages);
  };

  const handleSetPrimary = (id: string) => {
    const newImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{variantLabel} Images</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {images.length} / {maxImages} images • Drag to reorder
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-2 text-gray-400" size={32} />
          {isDragActive ? (
            <p className="text-sm text-blue-600 font-medium">Drop images here...</p>
          ) : (
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Drag & drop images or click to upload
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {maxImages - images.length} slots remaining
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Grid with Drag and Drop */}
      {images.length > 0 && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={image.id} className="relative">
                  <SortableImage
                    image={image}
                    onDelete={() => handleDelete(image.id)}
                    onSetPrimary={() => handleSetPrimary(image.id)}
                    isPrimary={image.isPrimary || false}
                  />
                  {/* Position Indicator */}
                  <div className="absolute -top-2 -left-2 bg-gray-800 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={32} />
            </button>
            <Image
              src={previewImage}
              alt="Preview"
              width={1200}
              height={1200}
              className="max-h-[90vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
