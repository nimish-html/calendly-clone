import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

// Create a matcher for the API routes
const apiMatcher = createRouteMatcher('/api/:path*');

export default clerkMiddleware({
  publicRoutes: ["/", "/book(.*)"],
  afterAuth(auth, req) {
    // Check if this is an API request
    const isApiRoute = apiMatcher.test(req.url);
    
    // If this is an API route and there's no user, return 401
    if (isApiRoute && !auth.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // For non-API routes that require auth, redirect to sign in
    if (!auth.userId && !auth.isPublicRoute) {
      const homeURL = new URL("/sign-in", req.url);
      return NextResponse.redirect(homeURL);
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};