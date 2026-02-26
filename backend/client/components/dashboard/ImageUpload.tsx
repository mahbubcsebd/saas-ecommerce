"use client";

import { Button } from "@/components/ui/button";
import { ImagePlus, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface ImageUploadProps {
    value?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    onRemove: () => void;
    id?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    disabled,
    onChange,
    onRemove,
    id = "image-upload"
}) => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.accessToken}`
                },
                body: formData
            });

            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.message || "Upload failed");
            }

            const data = await res.json();
            const newUrl = data.data?.[0]?.url;

            if (newUrl) {
                onChange(newUrl);
                toast.success("Image uploaded");
            }

        } catch (error: any) {
            console.error("Upload error", error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
            // Reset input
            e.target.value = "";
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {value && (
                <div className="relative w-[200px] h-[200px] rounded-md overflow-hidden border bg-secondary/10">
                    <div className="z-10 absolute top-2 right-2">
                            <Button type="button" onClick={onRemove} variant="destructive" size="icon">
                            <Trash className="h-4 w-4" />
                            </Button>
                    </div>
                    <Image
                        fill
                        className="object-cover"
                        alt="Image"
                        src={value}
                    />
                </div>
            )}
            {!value && (
                <div className="relative">
                    <Button
                        type="button"
                        disabled={disabled || loading}
                        variant="secondary"
                        onClick={() => document.getElementById(id)?.click()}
                    >
                        <ImagePlus className="h-4 w-4 mr-2" />
                        {loading ? "Uploading..." : "Upload Image"}
                    </Button>
                    <input
                        id={id}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onUpload}
                        disabled={disabled || loading}
                    />
                </div>
            )}
        </div>
    );
}

export default ImageUpload;
