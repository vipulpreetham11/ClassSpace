export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden">
      {children}
    </div>
  );
}
