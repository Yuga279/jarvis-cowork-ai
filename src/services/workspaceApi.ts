import { getAccessToken } from './workspaceAuth';

const checkToken = async (): Promise<string> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Workspace access token missing or expired. Please sign in with Google.');
  }
  return token;
};

// ==========================================
// 1. GMAIL SERVICE
// ==========================================
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export const gmailService = {
  async listMessages(query = '', maxResults = 10): Promise<GmailMessageSummary[]> {
    const token = await checkToken();
    const params = new URLSearchParams({
      maxResults: String(maxResults),
      ...(query ? { q: query } : {}),
    });

    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gmail API error: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.messages || !data.messages.length) return [];

    // Fetch details for each message
    const details = await Promise.all(
      data.messages.slice(0, maxResults).map(async (msg: { id: string; threadId: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!detailRes.ok) return null;
          const detailData = await detailRes.json();
          const headers = detailData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: detailData.snippet || '',
            subject,
            from,
            date,
          };
        } catch {
          return null;
        }
      })
    );

    return details.filter((m): m is GmailMessageSummary => m !== null);
  },

  async sendEmail(to: string, subject: string, bodyText: string): Promise<{ id: string }> {
    const token = await checkToken();

    // RFC 2822 compliant message formatted and base64url encoded
    const emailLines = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      bodyText,
    ];
    const rawEmail = emailLines.join('\r\n');
    const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to send email: ${res.statusText}`);
    }

    return await res.json();
  },

  async createDraft(to: string, subject: string, bodyText: string): Promise<{ id: string }> {
    const token = await checkToken();
    const emailLines = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      bodyText,
    ];
    const rawEmail = emailLines.join('\r\n');
    const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: { raw: encodedEmail } }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create draft: ${res.statusText}`);
    }

    return await res.json();
  },
};

// ==========================================
// 2. GOOGLE DRIVE SERVICE
// ==========================================
export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}

export const driveService = {
  async listFiles(query = '', pageSize = 15): Promise<DriveFileSummary[]> {
    const token = await checkToken();
    const qParts = ["trashed = false"];
    if (query) {
      qParts.push(`name contains '${query.replace(/'/g, "\\'")}'`);
    }
    const params = new URLSearchParams({
      pageSize: String(pageSize),
      fields: 'files(id, name, mimeType, webViewLink, modifiedTime, size)',
      q: qParts.join(' and '),
      orderBy: 'modifiedTime desc',
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Drive API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  },

  async createFile(name: string, content: string, mimeType = 'text/plain'): Promise<DriveFileSummary> {
    const token = await checkToken();

    const metadata = {
      name,
      mimeType,
    };

    const boundary = '-------JarvisDriveMultipartBoundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create file on Drive: ${res.statusText}`);
    }

    return await res.json();
  },
};

// ==========================================
// 3. GOOGLE SHEETS SERVICE
// ==========================================
export const sheetsService = {
  async createSpreadsheet(title: string, headers: string[] = []): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const token = await checkToken();

    const body: any = {
      properties: { title },
    };

    if (headers && headers.length > 0) {
      body.sheets = [
        {
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: headers.map((header) => ({
                    userEnteredValue: { stringValue: header },
                  })),
                },
              ],
            },
          ],
        },
      ];
    }

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create spreadsheet: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      spreadsheetId: data.spreadsheetId,
      spreadsheetUrl: data.spreadsheetUrl,
    };
  },

  async appendRow(spreadsheetId: string, values: (string | number)[][], range = 'Sheet1!A1'): Promise<any> {
    const token = await checkToken();

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to append values to sheet: ${res.statusText}`);
    }

    return await res.json();
  },

  async getValues(spreadsheetId: string, range = 'Sheet1!A1:Z100'): Promise<string[][]> {
    const token = await checkToken();

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to read sheet: ${res.statusText}`);
    }

    const data = await res.json();
    return data.values || [];
  },
};

// ==========================================
// 4. GOOGLE CALENDAR SERVICE
// ==========================================
export interface CalendarEventSummary {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  htmlLink?: string;
  location?: string;
}

export const calendarService = {
  async listEvents(timeMin?: string, maxResults = 15): Promise<CalendarEventSummary[]> {
    const token = await checkToken();
    const minIso = timeMin || new Date().toISOString();
    const params = new URLSearchParams({
      calendarId: 'primary',
      timeMin: minIso,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: String(maxResults),
    });

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Calendar API error: ${res.statusText}`);
    }

    const data = await res.json();
    const items = data.items || [];
    return items.map((evt: any) => ({
      id: evt.id,
      summary: evt.summary || '(Untitled Event)',
      description: evt.description || '',
      start: evt.start?.dateTime || evt.start?.date || '',
      end: evt.end?.dateTime || evt.end?.date || '',
      htmlLink: evt.htmlLink,
      location: evt.location,
    }));
  },

  async createEvent(
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description = '',
    location = ''
  ): Promise<CalendarEventSummary> {
    const token = await checkToken();

    const body: any = {
      summary,
      description,
      location,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create calendar event: ${res.statusText}`);
    }

    const evt = await res.json();
    return {
      id: evt.id,
      summary: evt.summary,
      description: evt.description,
      start: evt.start?.dateTime || evt.start?.date,
      end: evt.end?.dateTime || evt.end?.date,
      htmlLink: evt.htmlLink,
      location: evt.location,
    };
  },

  async deleteEvent(eventId: string): Promise<void> {
    const token = await checkToken();
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok && res.status !== 404) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete event: ${res.statusText}`);
    }
  },
};
