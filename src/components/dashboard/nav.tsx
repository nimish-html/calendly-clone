import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Event Types",
    href: "/dashboard/event-types",
  },
  {
    title: "Availability",
    href: "/dashboard/availability",
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors hover:text-blue-600 ${
            pathname === item.href
              ? "text-blue-600"
              : "text-gray-600"
          }`}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
