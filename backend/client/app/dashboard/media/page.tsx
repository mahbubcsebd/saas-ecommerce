'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { fetchApiClient as fetchApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ImagePlus, Copy, Trash2, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface MediaItem {
  public_id: string;
  format: string;
  secure_url: string;
  bytes: number;
  width: number;
  height: number;
  created_at: string;
}

export default function MediaLibraryPage() {
  const { data: session } = useSession();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('all');

  const fetchMedia = async () => {
    try {
      setLoading(true);
      // Query our custom media endpoint
      const prefix = folder === 'all' ? '' : folder;
      const res = await fetchApi<{ success: boolean; data: { resources: MediaItem[] } }>(
        `/media?prefix=${prefix}`
      );
      if (res.success && res.data?.resources) {
        setMedia(res.data.resources);
      }
    } catch (err) {
      console.error('Fetch media error', err);
      toast.error('Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchMedia();
    }
  }, [session, folder]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    // multer expects files to be under 'image' or flexible fields depending on setup
    // let's append under 'image'
    formData.append('image', files[0]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      toast.success('Media uploaded successfully!');
      fetchMedia(); // Refresh list
    } catch (err: any) {
      console.error('Upload error', err);
      toast.error(err.message || 'Failed to upload media file');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Image link copied to clipboard!');
  };

  const handleDelete = async (public_id: string) => {
    if (!confirm('Are you sure you want to delete this media asset? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetchApi<{ success: boolean; message: string }>('/media/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id })
      });

      if (res.success) {
        toast.success('Media asset deleted successfully');
        setMedia(media.filter((item) => item.public_id !== public_id));
      } else {
        throw new Error(res.message || 'Failed to delete');
      }
    } catch (err: any) {
      console.error('Delete error', err);
      toast.error(err.message || 'Failed to delete media asset');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter media based on search query
  const filteredMedia = media.filter((item) => {
    const filename = item.public_id.split('/').pop() || '';
    return filename.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Manage your Cloudinary store assets and product images.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchMedia} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading && 'animate-spin'}`} />
          </Button>

          <Button
            disabled={uploading}
            onClick={() => document.getElementById('media-upload')?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            Upload File
          </Button>
          <input
            id="media-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by file name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-[200px]">
          <Select value={folder} onValueChange={setFolder}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              <SelectItem value="ecommerce/general">General Uploads</SelectItem>
              <SelectItem value="ecommerce/products">Product Images</SelectItem>
              <SelectItem value="ecommerce/categories">Category Icons</SelectItem>
              <SelectItem value="ecommerce/brands">Brand Logos</SelectItem>
              <SelectItem value="ecommerce/hero">Hero Slides</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[35vh] border-2 border-dashed rounded-xl p-8 bg-card text-center">
          <ImagePlus className="h-12 w-12 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-lg">No media found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            Try uploading a new image or change your folder filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredMedia.map((item) => {
            const filename = item.public_id.split('/').pop() || '';
            const pathParts = item.public_id.split('/');
            const subfolder = pathParts.length > 2 ? pathParts[pathParts.length - 2] : 'general';

            return (
              <Card key={item.public_id} className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full bg-slate-100/60 overflow-hidden flex items-center justify-center border-b">
                    <Image
                      src={item.secure_url}
                      alt={filename}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                    />

                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full shadow"
                        onClick={() => handleCopyLink(item.secure_url)}
                        title="Copy Link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <a
                        href={item.secure_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full shadow bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        title="Open Original"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full shadow"
                        onClick={() => handleDelete(item.public_id)}
                        title="Delete Asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold truncate text-slate-800" title={filename}>
                      {filename}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{item.format.toUpperCase()}</span>
                      <span>{formatBytes(item.bytes)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 capitalize">
                      <span>{subfolder}</span>
                      <span>{item.width}x{item.height}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
