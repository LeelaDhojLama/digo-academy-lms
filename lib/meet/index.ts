import 'server-only';

import { randomUUID } from 'node:crypto';

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

import { db } from '@/lib/db';
import { env, isMeetConfigured } from '@/lib/env';

export { isMeetConfigured };

/**
 * Google Meet integration seam (SOLID/DIP) — everything Calendar/Meet-related
 * goes through this module so features never touch the Google SDK directly.
 *
 * One shared Google account is connected once (admin, via OAuth) and used to
 * create every LiveClass's Calendar event with an auto-generated Meet link.
 * Tokens are stored on the singleton `GoogleMeetConnection` row, mirroring how
 * Better Auth stores OAuth tokens on `Account` — plain columns, no separate
 * encryption layer, consistent with the rest of this codebase.
 */

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const CONNECTION_ID = 'singleton';

function redirectUri(): string {
  return `${env.BETTER_AUTH_URL}/api/google-meet/callback`;
}

function requireConfig() {
  if (!isMeetConfigured) {
    throw new Error('Google Meet is not configured (set GOOGLE_MEET_CLIENT_ID/SECRET).');
  }
  return { clientId: env.GOOGLE_MEET_CLIENT_ID!, clientSecret: env.GOOGLE_MEET_CLIENT_SECRET! };
}

function newOAuthClient(): OAuth2Client {
  const { clientId, clientSecret } = requireConfig();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri());
}

/** Build the Google consent-screen URL the admin is redirected to. */
export function getMeetAuthUrl(state: string): string {
  const client = newOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force a refresh_token even on a reconnect
    scope: SCOPES,
    state,
  });
}

/** Exchange the OAuth callback `code` for tokens and persist the connection. */
export async function exchangeMeetCode(code: string): Promise<{ accountEmail: string }> {
  const client = newOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Disconnect any prior grant for this app in your Google Account, then try connecting again.'
    );
  }
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: client, version: 'v2' });
  const { data } = await oauth2.userinfo.get();
  if (!data.email) throw new Error('Could not read the connected Google account email.');

  await db.googleMeetConnection.upsert({
    where: { id: CONNECTION_ID },
    create: {
      id: CONNECTION_ID,
      accountEmail: data.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 60 * 60 * 1000),
    },
    update: {
      accountEmail: data.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 60 * 60 * 1000),
    },
  });

  return { accountEmail: data.email };
}

/** Current connection status for the admin settings page. */
export async function getMeetConnection(): Promise<{ accountEmail: string; connectedAt: Date } | null> {
  const row = await db.googleMeetConnection.findUnique({ where: { id: CONNECTION_ID } });
  return row ? { accountEmail: row.accountEmail, connectedAt: row.connectedAt } : null;
}

export async function disconnectMeet(): Promise<void> {
  const row = await db.googleMeetConnection.findUnique({ where: { id: CONNECTION_ID } });
  if (!row) return;
  try {
    const client = newOAuthClient();
    await client.revokeToken(row.refreshToken);
  } catch (error) {
    // Best-effort — still drop the local row even if Google's revoke call fails
    // (e.g. the grant was already revoked on Google's side).
    console.error('google-meet: revoke failed', error);
  }
  await db.googleMeetConnection.delete({ where: { id: CONNECTION_ID } });
}

/** An authorized client for the connected account, refreshing + persisting a
 * rotated access token automatically. Throws if nothing is connected. */
async function getAuthorizedClient(): Promise<OAuth2Client> {
  const row = await db.googleMeetConnection.findUnique({ where: { id: CONNECTION_ID } });
  if (!row) {
    throw new Error('Google Calendar is not connected. Connect it in Settings first.');
  }

  const client = newOAuthClient();
  client.setCredentials({
    access_token: row.accessToken,
    refresh_token: row.refreshToken,
    expiry_date: row.expiresAt.getTime(),
  });
  client.on('tokens', (tokens) => {
    if (!tokens.access_token) return;
    void db.googleMeetConnection
      .update({
        where: { id: CONNECTION_ID },
        data: {
          accessToken: tokens.access_token,
          expiresAt: new Date(tokens.expiry_date ?? Date.now() + 60 * 60 * 1000),
        },
      })
      .catch((error) => console.error('google-meet: token refresh persist failed', error));
  });
  return client;
}

export interface MeetEventInput {
  title: string;
  description?: string | null;
  startTime: Date;
  durationMin: number;
}

export interface MeetEventResult {
  meetLink: string;
  googleEventId: string;
}

/** Create a Calendar event with an auto-generated Meet link. */
export async function createMeetEvent(input: MeetEventInput): Promise<MeetEventResult> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const endTime = new Date(input.startTime.getTime() + input.durationMin * 60_000);

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: input.startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const meetLink = data.hangoutLink;
  if (!meetLink || !data.id) {
    throw new Error('Google did not return a Meet link for this event.');
  }
  return { meetLink, googleEventId: data.id };
}

/** UTC basic format Google's RRULE UNTIL expects, e.g. "20260921T000000Z". */
function toRRuleUntil(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export interface RecurringMeetEventInput extends MeetEventInput {
  /** Bound for the weekly recurrence; omit for an indefinite weekly series. */
  untilDate?: Date | null;
}

/**
 * Create a weekly recurring Calendar event (day/time taken from `startTime`,
 * bounded by `untilDate` if given). One Meet link is generated for the whole
 * series and stays the same for every occurrence — used for a batch's regular
 * class slot, as opposed to `createMeetEvent`'s one-off sessions.
 */
export async function createRecurringMeetEvent(
  input: RecurringMeetEventInput
): Promise<MeetEventResult> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const endTime = new Date(input.startTime.getTime() + input.durationMin * 60_000);
  const recurrence = `RRULE:FREQ=WEEKLY${input.untilDate ? `;UNTIL=${toRRuleUntil(input.untilDate)}` : ''}`;

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: input.startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      recurrence: [recurrence],
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const meetLink = data.hangoutLink;
  if (!meetLink || !data.id) {
    throw new Error('Google did not return a Meet link for this event.');
  }
  return { meetLink, googleEventId: data.id };
}

/** Update a recurring series' time/title/description/end bound (Meet link unchanged). */
export async function updateRecurringMeetEvent(
  googleEventId: string,
  input: RecurringMeetEventInput
): Promise<void> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const endTime = new Date(input.startTime.getTime() + input.durationMin * 60_000);
  const recurrence = `RRULE:FREQ=WEEKLY${input.untilDate ? `;UNTIL=${toRRuleUntil(input.untilDate)}` : ''}`;

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: input.startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      recurrence: [recurrence],
    },
  });
}

/** Update an existing event's time/title/description (Meet link is unchanged). */
export async function updateMeetEvent(
  googleEventId: string,
  input: MeetEventInput
): Promise<void> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const endTime = new Date(input.startTime.getTime() + input.durationMin * 60_000);

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: input.startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
    },
  });
}

/** Delete the Calendar event. Treats "already gone" as success. */
export async function deleteMeetEvent(googleEventId: string): Promise<void> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 404 || code === 410) return;
    throw error;
  }
}
