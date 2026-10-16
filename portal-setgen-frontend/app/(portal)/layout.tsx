import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { PortalMain } from '@/components/layout/PortalMain';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 print:h-auto print:overflow-visible">
        <div className="print:hidden shrink-0">
          <Topbar />
        </div>
        <PortalMain>
          <RouteGuard>{children}</RouteGuard>
        </PortalMain>
      </div>
    </div>
  );
}
