import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { RouteGuard } from '@/components/layout/RouteGuard';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-24 md:pb-12">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
