'use client';

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Calendar } from 'lucide-react';
import { usePathname } from "next/navigation";

export function MainNav() {
  const pathname = usePathname();

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

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 font-semibold text-blue-600">
            <Calendar className="h-6 w-6" />
            <span>Calendlier</span>
          </Link>

          <SignedIn>
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
          </SignedIn>
        </div>

        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/" 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </SignedIn>
          
          <SignedOut>
            <Link href="/sign-in">
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}