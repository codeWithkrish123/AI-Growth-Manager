import { google } from 'googleapis';

const getRedirectUri = () => {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  
  const appUrl = (process.env.APP_URL || 'http://localhost:3001').replace(/\/$/, '');
  return `${appUrl}/auth/google/callback`;
};

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID     || '',
  process.env.GOOGLE_CLIENT_SECRET || '',
  getRedirectUri()
);
