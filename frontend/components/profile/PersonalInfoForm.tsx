"use client";

import { updateProfileAction } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Camera, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface PersonalInfoFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    bio: string;
    dob?: Date;
    avatar?: string;
    username?: string;
  };
}

export default function PersonalInfoForm({ initialData }: PersonalInfoFormProps) {
  const { update: updateSession } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(updateProfileAction, {
    success: false,
    message: "",
  });

  const [formData, setFormData] = useState(initialData);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar || null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        setIsEditing(false);
        // Refresh session
        updateSession();
      } else {
        toast.error(state.message);
      }
    }
  }, [state, updateSession]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setFormData(initialData);
                setAvatarPreview(initialData.avatar || null);
                setAvatarFile(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={formAction} className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-muted cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                <AvatarFallback className="text-xl">{initialData.firstName?.charAt(0)}</AvatarFallback>
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
                name="avatar"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                disabled={!isEditing || isPending}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                disabled={!isEditing || isPending}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!isEditing || isPending}
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
                    disabled={!isEditing || isPending}
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
              <input type="hidden" name="dob" value={formData.dob?.toISOString() || ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                disabled={!isEditing || isPending}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Bio</Label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                disabled={!isEditing || isPending}
                placeholder="Tell us about yourself"
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
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
        </form>
      </CardContent>
    </Card>
  );
}
