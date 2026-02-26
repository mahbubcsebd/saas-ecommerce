"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Camera, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    bio: "",
    dob: undefined as Date | undefined,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        dob: user.dob ? new Date(user.dob) : undefined,
      });
      setAvatarPreview(user.image || user.avatar || null);
    }
  }, [session, isEditing]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: FormData) => {
      const res = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          // Let fetch handle Content-Type for FormData
        },
        body: updatedData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      return data;
    },
    onSuccess: async (data) => {
      // Update local session with the returned data from backend
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          ...data.data,
          name: `${data.data.firstName} ${data.data.lastName}`,
          image: data.data.avatar // Ensure image updates
        }
      });

      toast.success("Profile updated successfully");
      setIsEditing(false);
      setAvatarFile(null); // Reset file
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please login to view this page</p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    const user = session.user as any;

    let hasChanges = false;

    // Helper to append if changed
    const appendIfChanged = (key: string, newValue: any, originalValue: any) => {
      if (newValue !== originalValue) {
        formDataToSend.append(key, newValue);
        hasChanges = true;
      }
    };

    appendIfChanged("firstName", formData.firstName, user.firstName || "");
    appendIfChanged("lastName", formData.lastName, user.lastName || "");
    appendIfChanged("phone", formData.phone, user.phone || "");
    appendIfChanged("address", formData.address, user.address || "");
    appendIfChanged("bio", formData.bio, user.bio || "");

    const originalDob = user.dob ? new Date(user.dob).toISOString().split('T')[0] : null;
    const currentDob = formData.dob ? formData.dob.toISOString().split('T')[0] : null;

    if (currentDob !== originalDob && currentDob) {
       formDataToSend.append("dob", currentDob);
       hasChanges = true;
    }

    if (avatarFile) {
      formDataToSend.append("avatar", avatarFile);
      hasChanges = true;
    }

    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate(formDataToSend);
  };

  return (
    <div className="container py-10 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              setAvatarFile(null); // Reset preview on cancel if not saved
              setAvatarPreview((session.user as any).avatar || session.user.image);
            }} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-muted cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                   <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                  <AvatarFallback className="text-xl">{session.user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="text-white h-8 w-8" />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{session.user.name}</h3>
                <p className="text-muted-foreground">{session.user.email}</p>
                <p className="text-sm text-muted-foreground uppercase px-2 py-0.5 bg-secondary rounded-full inline-block">
                  {session.user.role}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  disabled={!isEditing}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={session.user.email || ""} disabled className="bg-muted/50" />
              </div>
               <div className="space-y-2">
                <Label>Username</Label>
                <Input value={(session.user as any).username || '-'} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <Label className="mb-1">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dob && "text-muted-foreground"
                      )}
                      disabled={!isEditing}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dob ? format(formData.dob, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dob}
                      onSelect={(date) => setFormData({...formData, dob: date})}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
               <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Enter address"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself"
                  className="min-h-[100px] resize-none"
                />
              </div>
              {isEditing && (
                <Button type="submit" className="hidden" disabled={updateMutation.isPending}>
                  Save
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
