import { google } from 'googleapis';
import { GOOGLE_OAUTH_CONFIG, DEFAULT_CALENDAR_TIMEZONE } from './config';
import { db } from '@/db';
import { googleAuth } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class GoogleCalendarService {
  private static createOAuthClient() {
    return new google.auth.OAuth2(
      GOOGLE_OAUTH_CONFIG.clientId,
      GOOGLE_OAUTH_CONFIG.clientSecret,
      GOOGLE_OAUTH_CONFIG.redirectUri
    );
  }

  static async getAuthUrl() {
    const oauth2Client = this.createOAuthClient();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_OAUTH_CONFIG.scopes,
      prompt: 'consent',
    });
  }

  static async handleCallback(code: string, clerkUserId: string) {
    const oauth2Client = this.createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error('Invalid tokens received from Google');
    }

    // Store tokens in database
    await db.insert(googleAuth).values({
      clerkUserId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
      scope: tokens.scope || GOOGLE_OAUTH_CONFIG.scopes.join(' '),
    });

    return tokens;
  }

  static async createCalendarEvent(clerkUserId: string, eventDetails: {
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail: string;
  }) {
    const authData = await db.query.googleAuth.findFirst({
      where: eq(googleAuth.clerkUserId, clerkUserId),
    });

    if (!authData) {
      throw new Error('User not connected to Google Calendar');
    }

    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({
      access_token: authData.accessToken,
      refresh_token: authData.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startTime.toISOString(),
        timeZone: DEFAULT_CALENDAR_TIMEZONE,
      },
      end: {
        dateTime: eventDetails.endTime.toISOString(),
        timeZone: DEFAULT_CALENDAR_TIMEZONE,
      },
      attendees: [
        { email: eventDetails.attendeeEmail },
      ],
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: true,
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    return {
      eventId: response.data.id,
      meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri,
      htmlLink: response.data.htmlLink,
    };
  }

  static async deleteCalendarEvent(clerkUserId: string, eventId: string) {
    const authData = await db.query.googleAuth.findFirst({
      where: eq(googleAuth.clerkUserId, clerkUserId),
    });

    if (!authData) {
      throw new Error('User not connected to Google Calendar');
    }

    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({
      access_token: authData.accessToken,
      refresh_token: authData.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }

  static async updateCalendarEvent(clerkUserId: string, eventId: string, eventDetails: {
    summary?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    attendeeEmail?: string;
  }) {
    const authData = await db.query.googleAuth.findFirst({
      where: eq(googleAuth.clerkUserId, clerkUserId),
    });

    if (!authData) {
      throw new Error('User not connected to Google Calendar');
    }

    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({
      access_token: authData.accessToken,
      refresh_token: authData.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Get existing event
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    // Update event fields
    const event = {
      ...existingEvent.data,
      summary: eventDetails.summary ?? existingEvent.data.summary,
      description: eventDetails.description ?? existingEvent.data.description,
      start: eventDetails.startTime ? {
        dateTime: eventDetails.startTime.toISOString(),
        timeZone: DEFAULT_CALENDAR_TIMEZONE,
      } : existingEvent.data.start,
      end: eventDetails.endTime ? {
        dateTime: eventDetails.endTime.toISOString(),
        timeZone: DEFAULT_CALENDAR_TIMEZONE,
      } : existingEvent.data.end,
      attendees: eventDetails.attendeeEmail ? [
        { email: eventDetails.attendeeEmail },
      ] : existingEvent.data.attendees,
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    });

    return {
      eventId: response.data.id,
      meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri,
      htmlLink: response.data.htmlLink,
    };
  }
}
