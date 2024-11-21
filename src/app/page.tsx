'use client';

import Link from "next/link";
import { MainNav } from "@/components/nav/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userId) {
      router.push('/dashboard');
    }
  }, [userId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex flex-col">
      <MainNav />
      <main className="flex-grow flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Scheduling meetings made{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              simple
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl text-gray-600 leading-relaxed">
            Share your Calendlier link and let others schedule meetings with you based on your availability.
            No more back-and-forth emails.
          </p>
          <div className="mt-12 flex items-center justify-center gap-6">
            <Link href="/sign-up">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-xl transition-all duration-200"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-8 text-center text-gray-600 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <p className="text-sm">&copy; {new Date().getFullYear()} Calendlier</p>
      </footer>
    </div>
  );
}
