import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/google/calendar';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return new NextResponse('Missing authorization code', { status: 400 });
    }

    await GoogleCalendarService.handleCallback(code, user.id);
    
    // Redirect to settings page or dashboard after successful connection
    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (error) {
    console.error('Error handling Google callback:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
