import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { BottomDock } from "@/components/shell/BottomDock";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 max-w-[1280px] w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Dock */}
      <BottomDock />
    </div>
  );
}
