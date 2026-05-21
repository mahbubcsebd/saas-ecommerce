'use client';

import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const closeSidebar = () => setIsSidebarOpen(false);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="print:hidden print-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          isCollapsed={isCollapsed}
          onClose={closeSidebar}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out print:ml-0 ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <div className="print:hidden print-hidden">
          <Header onMenuClick={toggleSidebar} />
        </div>
        <main className="flex-1 p-4 lg:p-6 bg-slate-50 dark:bg-slate-900/50 print:bg-white print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
