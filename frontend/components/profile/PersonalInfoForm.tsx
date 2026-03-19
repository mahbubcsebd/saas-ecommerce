'use client';

import { changePasswordAction, ProfileState, updateProfileAction } from '@/actions/profile';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, Camera, Loader2, Lock, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { t } = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFormRef = useRef<HTMLFormElement>(null);

  // Profile Update Mutation
  const profileMutation = useMutation({
    mutationFn: (formData: FormData) =>
      updateProfileAction({ success: false, message: '' }, formData),
    onSuccess: (state: ProfileState) => {
      if (state.success) {
        toast.success(state.message);
        setIsEditing(false);

        // Sync local data with server response for immediate feedback
        if (state.user) {
          const updatedUser = {
            firstName: state.user.firstName || '',
            lastName: state.user.lastName || '',
            phone: state.user.phone || '',
            address: state.user.address || '',
            bio: state.user.bio || '',
            dob: state.user.dob ? new Date(state.user.dob) : undefined,
            avatar: state.user.avatar || null,
            username: state.user.username || '',
          };
          setFormData(updatedUser);
          if (state.user.avatar) {
            setAvatarPreview(state.user.avatar);
          }

          // Pass the updated user data to next-auth update function
          updateSession({
            user: {
              ...updatedUser,
              image: updatedUser.avatar, // NextAuth uses 'image' for avatar
            },
          });
        }

        router.refresh(); // Sync server components
      } else {
        toast.error(state.message || 'Update failed');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile.');
    },
  });

  // Password Change Action
  const [passwordState, passwordAction, isPasswordPending] = useActionState(changePasswordAction, {
    success: false,
    message: '',
  });

  const [formData, setFormData] = useState(initialData);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar || null);
  const processedPasswordStateRef = useRef<any>(null);

  // Handle Password State Changes
  useEffect(() => {
    if (passwordState.message && passwordState !== processedPasswordStateRef.current) {
      processedPasswordStateRef.current = passwordState;
      if (passwordState.success) {
        toast.success(passwordState.message);
      } else {
        toast.error(passwordState.message);
      }
    }
  }, [passwordState]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));

      // Immediate Upload Logic
      const uploadData = new FormData();
      uploadData.append('avatar', file);

      // Include required fields for backend validation if necessary
      uploadData.append('firstName', formData.firstName);
      uploadData.append('lastName', formData.lastName);

      profileMutation.mutate(uploadData);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formDataObj = new FormData(e.currentTarget);
    // Ensure DOB is included if set
    if (formData.dob) {
      formDataObj.set('dob', formData.dob.toISOString());
    }
    profileMutation.mutate(formDataObj);
  };

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('profile', 'personalInfo')}
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-primary uppercase tracking-wider hover:underline"
            >
              {t('profile', 'editProfile')}
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData(initialData);
                setAvatarPreview(initialData.avatar || null);
              }}
              className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-red-500"
            >
              {t('common', 'cancel')}
            </button>
          )}
        </div>

        <form onSubmit={handleProfileSubmit} ref={profileFormRef} className="space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative cursor-pointer ring-4 ring-slate-50 dark:ring-slate-900 shadow-sm transition-all group-hover:ring-primary/10"
                onClick={() => !profileMutation.isPending && fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    className={cn(
                      'w-full h-full object-cover transition-transform group-hover:scale-110',
                      profileMutation.isPending && 'opacity-50 grayscale'
                    )}
                    alt="Avatar"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <UserIcon className="w-8 h-8" />
                  </div>
                )}

                {/* Uploading Overlay */}
                {profileMutation.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center cursor-pointer shadow-md border-2 border-white dark:border-slate-900 hover:scale-110 active:scale-95 transition-transform"
                onClick={() => !profileMutation.isPending && fileInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5" />
              </div>

              <input
                type="file"
                name="avatar"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={profileMutation.isPending}
              />
            </div>

            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t('profile', 'profilePhoto')}
              </p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {t('profile', 'tapToChange')}
              </p>
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <p className="text-sm font-medium text-slate-500">{t('profile', 'generalInfo')}</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('profile', 'personalDetails')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('common', 'firstName')}
              </Label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing || profileMutation.isPending}
                placeholder={t('common', 'firstName')}
                className="border-slate-200 dark:border-slate-800 focus:ring-primary h-11 font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all rounded-lg shadow-sm disabled:opacity-80 disabled:bg-slate-50 dark:disabled:bg-slate-950"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('common', 'lastName')}
              </Label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing || profileMutation.isPending}
                placeholder={t('common', 'lastName')}
                className="border-slate-200 dark:border-slate-800 focus:ring-primary h-11 font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all rounded-lg shadow-sm disabled:opacity-80 disabled:bg-slate-50 dark:disabled:bg-slate-950"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('common', 'phone')}
              </Label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing || profileMutation.isPending}
                placeholder="01xxxxxxxxx"
                className="border-slate-200 dark:border-slate-800 focus:ring-primary h-11 font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all rounded-lg shadow-sm disabled:opacity-80 disabled:bg-slate-50 dark:disabled:bg-slate-950"
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                {t('profile', 'dob')}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left h-11 border-slate-200 dark:border-slate-800 font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all rounded-lg shadow-sm disabled:opacity-80 disabled:bg-slate-50 dark:disabled:bg-slate-950',
                      !formData.dob && 'text-slate-400 dark:text-slate-500'
                    )}
                    disabled={!isEditing || profileMutation.isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    {formData.dob ? (
                      format(formData.dob, 'PPP')
                    ) : (
                      <span className="text-slate-400">
                        {t('common', 'notSet', { defaultValue: 'Not set' })}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-slate-200 dark:border-slate-800"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={formData.dob}
                    onSelect={(date) => setFormData({ ...formData, dob: date })}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="dob"
                value={formData.dob ? formData.dob.toISOString() : ''}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('profile', 'bio')}
              </Label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing || profileMutation.isPending}
                placeholder={t('profile', 'bioPlaceholder', {
                  defaultValue: 'A short description about yourself...',
                })}
                className="min-h-[100px] border-slate-200 dark:border-slate-800 focus:ring-primary font-medium resize-none shadow-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all rounded-lg disabled:opacity-80 disabled:bg-slate-50 dark:disabled:bg-slate-950"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={profileMutation.isPending}
                className="px-10 space-x-2 font-bold uppercase tracking-wider text-xs h-11 rounded-xl shadow-md transition-all active:scale-95"
              >
                {profileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('common', 'processing')}</span>
                  </>
                ) : (
                  <span>{t('common', 'save')}</span>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Security Section with Current Password */}
      <div className="space-y-6">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('profile', 'securitySettings', { defaultValue: 'Security Settings' })}
          </h3>
        </div>

        <form action={passwordAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('auth', 'currentPassword', { defaultValue: 'Current Password' })}
              </Label>
              <Input
                name="currentPassword"
                type="password"
                required
                placeholder={t('auth', 'currentPassword', { defaultValue: 'Current Password' })}
                className="border-slate-200 dark:border-slate-800 focus:ring-primary h-11 font-medium bg-slate-50/50 transition-all rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('auth', 'newPassword', { defaultValue: 'New Password' })}
              </Label>
              <Input
                name="newPassword"
                type="password"
                required
                placeholder={t('auth', 'newPassword', { defaultValue: 'New Password' })}
                className="border-slate-200 dark:border-slate-800 focus:ring-primary h-11 font-medium bg-slate-50/50 transition-all rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('auth', 'confirmPassword')}
              </Label>
              <Input
                name="confirmPassword"
                type="password"
                required
                placeholder={t('auth', 'confirmPassword')}
                className="border-slate-200 dark:border-slate-800 focus:ring-primary h-11 font-medium bg-slate-50/50 transition-all rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPasswordPending}
              className="text-xs font-bold uppercase tracking-wider h-11 px-8 rounded-xl border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
              variant="outline"
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('common', 'processing')}</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />{' '}
                  {t('profile', 'updateSecurity', { defaultValue: 'Update Security' })}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
