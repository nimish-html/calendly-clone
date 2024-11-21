export const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
};

export const DEFAULT_CALENDAR_TIMEZONE = 'UTC';
export const GOOGLE_CALENDAR_API_ENDPOINT = 'https://www.googleapis.com/calendar/v3';
