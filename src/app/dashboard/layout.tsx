import { Sidebar } from "./BeautifulSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
        {children}
      </main>
    </div>
  );
}
