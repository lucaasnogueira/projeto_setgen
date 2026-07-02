import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';

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
        <main className="flex-1 overflow-y-auto px-8 pt-7 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
