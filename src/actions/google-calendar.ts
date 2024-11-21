'use server';

import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { googleAuth } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { GoogleCalendarService } from '@/lib/google/calendar';

export async function checkGoogleCalendarConnection() {
  try {
    console.log('Starting Google Calendar connection check');
    const user = await currentUser();
    console.log('User from auth:', user?.id);
    
    if (!user?.id) {
      console.log('No user ID found');
      return { connected: false };
    }

    const authData = await db.query.googleAuth.findFirst({
      where: eq(googleAuth.clerkUserId, user.id),
    });
    console.log('Auth data found:', !!authData);

    const authUrl = !authData ? await GoogleCalendarService.getAuthUrl() : null;
    console.log('Auth URL generated:', !!authUrl);
    
    return { 
      connected: !!authData,
      authUrl: authUrl
    };
  } catch (error) {
    console.error('Detailed error in checkGoogleCalendarConnection:', {
      error,
      message: error.message,
      stack: error.stack
    });
    return { connected: false };
  }
}
