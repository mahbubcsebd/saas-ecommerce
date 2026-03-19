import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AccountSidebar from '@/components/profile/AccountSidebar';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile');
  }

  return (
    <div className="border-t">
      <div className="container py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Account Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <AccountSidebar />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
