import { NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/google/calendar';
import { auth } from '@clerk/nextjs';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const authUrl = await GoogleCalendarService.getAuthUrl();
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
