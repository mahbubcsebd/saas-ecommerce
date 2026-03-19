import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function ProfileEditPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile/edit');
  }

  const user = session.user as any;

  const initialData = {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    address: user.address || '',
    bio: user.bio || '',
    dob: user.dob ? new Date(user.dob) : undefined,
    avatar: user.image || user.avatar || null,
    username: user.username || '',
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Edit Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Manage your personal information, address, and login credentials.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <ProfileHeader user={session.user} />
        <div className="mt-8">
          <PersonalInfoForm initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
