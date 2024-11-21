import { MainNav } from "@/components/nav/main-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      {children}
    </div>
  );
}
