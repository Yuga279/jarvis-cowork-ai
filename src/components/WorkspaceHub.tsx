import React, { useState } from 'react';
import {
  gmailService,
  driveService,
  sheetsService,
  calendarService,
  GmailMessageSummary,
  DriveFileSummary,
  CalendarEventSummary,
} from '../services/workspaceApi';
import { ConfirmationRequest } from '../types';
import {
  Mail,
  HardDrive,
  Table,
  Calendar,
  Globe,
  Plus,
  Search,
  ExternalLink,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

interface WorkspaceHubProps {
  isWorkspaceConnected: boolean;
  onRequestConfirmation: (req: ConfirmationRequest) => void;
  onInitiateLogin: () => void;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  isWorkspaceConnected,
  onRequestConfirmation,
  onInitiateLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'gmail' | 'drive' | 'sheets' | 'calendar' | 'browser'>('gmail');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gmail State
  const [emails, setEmails] = useState<GmailMessageSummary[]>([]);
  const [emailQuery, setEmailQuery] = useState('');
  const [composeModal, setComposeModal] = useState(false);
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');

  // Drive State
  const [driveFiles, setDriveFiles] = useState<DriveFileSummary[]>([]);
  const [driveQuery, setDriveQuery] = useState('');

  // Sheets State
  const [sheetTitle, setSheetTitle] = useState('');
  const [createdSheets, setCreatedSheets] = useState<{ id: string; url: string; title: string }[]>([]);
  const [sheetValues, setSheetValues] = useState<string[][]>([]);

  // Calendar State
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [eventSummary, setEventSummary] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');

  // Browser Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  // Load Gmail messages
  const loadEmails = async () => {
    if (!isWorkspaceConnected) return;
    setLoading(true);
    setError(null);
    try {
      const data = await gmailService.listMessages(emailQuery, 8);
      setEmails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Gmail inbox');
    } finally {
      setLoading(false);
    }
  };

  // Load Drive files
  const loadDriveFiles = async () => {
    if (!isWorkspaceConnected) return;
    setLoading(true);
    setError(null);
    try {
      const data = await driveService.listFiles(driveQuery, 10);
      setDriveFiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Drive files');
    } finally {
      setLoading(false);
    }
  };

  // Load Calendar events
  const loadCalendarEvents = async () => {
    if (!isWorkspaceConnected) return;
    setLoading(true);
    setError(null);
    try {
      const data = await calendarService.listEvents(new Date().toISOString(), 10);
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Calendar events');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Send Email with mandatory confirmation
  const handleTriggerSendEmail = () => {
    if (!mailTo || !mailSubject || !mailBody) {
      alert('Please fill out recipient, subject, and body.');
      return;
    }

    onRequestConfirmation({
      id: `confirm_${Date.now()}`,
      stepId: 'manual_gmail_send',
      tool: 'gmail.send',
      title: 'Send Outgoing Email via Gmail',
      description: `Jarvis will transmit an email to ${mailTo} from your Google account.`,
      details: {
        Recipient: mailTo,
        Subject: mailSubject,
        'Message Body': mailBody,
      },
      onConfirm: async () => {
        setLoading(true);
        try {
          await gmailService.sendEmail(mailTo, mailSubject, mailBody);
          setComposeModal(false);
          setMailTo('');
          setMailSubject('');
          setMailBody('');
          await loadEmails();
        } catch (err: any) {
          setError(err.message || 'Error sending email');
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        // user aborted
      },
    });
  };

  // Trigger Calendar event creation with mandatory confirmation
  const handleTriggerCreateEvent = () => {
    if (!eventSummary || !eventDate) {
      alert('Please specify event title and date.');
      return;
    }

    const startIso = new Date(`${eventDate}T${eventStartTime}:00`).toISOString();
    const endIso = new Date(`${eventDate}T${eventEndTime}:00`).toISOString();

    onRequestConfirmation({
      id: `confirm_${Date.now()}`,
      stepId: 'manual_calendar_create',
      tool: 'calendar.create',
      title: 'Schedule Google Calendar Event',
      description: `Jarvis will create a new meeting on your primary Google Calendar.`,
      details: {
        Title: eventSummary,
        'Start Time': startIso,
        'End Time': endIso,
      },
      onConfirm: async () => {
        setLoading(true);
        try {
          await calendarService.createEvent(eventSummary, startIso, endIso);
          setEventSummary('');
          await loadCalendarEvents();
        } catch (err: any) {
          setError(err.message || 'Error creating event');
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {},
    });
  };

  // Trigger Sheets creation
  const handleCreateSheet = async () => {
    if (!sheetTitle) return;
    setLoading(true);
    try {
      const res = await sheetsService.createSpreadsheet(sheetTitle, ['Timestamp', 'Workflow Task', 'Status', 'Notes']);
      setCreatedSheets((prev) => [{ id: res.spreadsheetId, url: res.spreadsheetUrl, title: sheetTitle }, ...prev]);
      setSheetTitle('');
    } catch (err: any) {
      setError(err.message || 'Error creating spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  // Perform Browser Search
  const handleBrowserSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/browser/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setSearchResult(data);
    } catch (err: any) {
      setError(err.message || 'Web research failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Workspace Sub-tabs Navigation */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('gmail');
              if (!emails.length && isWorkspaceConnected) loadEmails();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'gmail'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-rose-400" />
            Gmail
          </button>
          <button
            onClick={() => {
              setActiveTab('drive');
              if (!driveFiles.length && isWorkspaceConnected) loadDriveFiles();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            Drive
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sheets'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            Sheets
          </button>
          <button
            onClick={() => {
              setActiveTab('calendar');
              if (!events.length && isWorkspaceConnected) loadCalendarEvents();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('browser')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'browser'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Browser Search
          </button>
        </div>

        {activeTab !== 'browser' && !isWorkspaceConnected && (
          <button
            onClick={onInitiateLogin}
            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Connect to view live data
          </button>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* 1. GMAIL TAB */}
        {activeTab === 'gmail' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search emails (e.g. from:manager, is:unread)..."
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadEmails()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={loadEmails}
                disabled={loading || !isWorkspaceConnected}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Fetch
              </button>
              <button
                onClick={() => setComposeModal(true)}
                disabled={!isWorkspaceConnected}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Compose
              </button>
            </div>

            {/* Compose Modal */}
            {composeModal && (
              <div className="p-4 bg-slate-950 border border-rose-500/40 rounded-xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300">New Email (Requires Confirmation)</span>
                  <button onClick={() => setComposeModal(false)} className="text-slate-400 hover:text-white text-xs">
                    Cancel
                  </button>
                </div>
                <input
                  type="email"
                  placeholder="Recipient (to: colleague@example.com)"
                  value={mailTo}
                  onChange={(e) => setMailTo(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
                <textarea
                  placeholder="Email contents..."
                  rows={3}
                  value={mailBody}
                  onChange={(e) => setMailBody(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white outline-none resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleTriggerSendEmail}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send (with Confirmation)
                  </button>
                </div>
              </div>
            )}

            {/* Email list */}
            {emails.length > 0 ? (
              <div className="space-y-2">
                {emails.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-950/60 border border-slate-850 hover:border-slate-700 rounded-xl flex flex-col gap-1 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate max-w-[200px]">{m.from}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{m.date}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-300 truncate">{m.subject}</div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{m.snippet}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                {isWorkspaceConnected ? 'No emails loaded. Click Fetch or search query.' : 'Connect Google Workspace to query your Gmail inbox.'}
              </div>
            )}
          </div>
        )}

        {/* 2. DRIVE TAB */}
        {activeTab === 'drive' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search Google Drive files..."
                  value={driveQuery}
                  onChange={(e) => setDriveQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={loadDriveFiles}
                disabled={loading || !isWorkspaceConnected}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Search
              </button>
            </div>

            {driveFiles.length > 0 ? (
              <div className="space-y-2">
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 bg-slate-950/60 border border-slate-850 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{file.name}</div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">{file.mimeType}</div>
                      </div>
                    </div>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg shrink-0"
                        title="Open in Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                {isWorkspaceConnected ? 'No files found. Search Drive above.' : 'Connect Google Workspace to access your Drive files.'}
              </div>
            )}
          </div>
        )}

        {/* 3. SHEETS TAB */}
        {activeTab === 'sheets' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl flex flex-col gap-3">
              <span className="text-xs font-bold text-emerald-300">Create New Google Spreadsheet</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Spreadsheet title (e.g. Q4 Executive Tracker)"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleCreateSheet}
                  disabled={loading || !sheetTitle || !isWorkspaceConnected}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Sheet
                </button>
              </div>
            </div>

            {createdSheets.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Managed Spreadsheets:
                </span>
                {createdSheets.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-white">{s.title}</span>
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      Open in Sheets <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-slate-950 border border-sky-500/30 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300">Schedule Meeting (Requires Confirmation)</span>
                <button
                  onClick={loadCalendarEvents}
                  disabled={loading || !isWorkspaceConnected}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
              <input
                type="text"
                placeholder="Meeting Summary (e.g. Strategy Sync with Executive Team)"
                value={eventSummary}
                onChange={(e) => setEventSummary(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
                <input
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
                <input
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleTriggerCreateEvent}
                  disabled={!isWorkspaceConnected}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule (with Confirmation)
                </button>
              </div>
            </div>

            {/* Events List */}
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-slate-950/60 border border-slate-850 hover:border-slate-700 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{evt.summary}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(evt.start).toLocaleString()} - {new Date(evt.end).toLocaleTimeString()}
                      </div>
                    </div>
                    {evt.htmlLink && (
                      <a
                        href={evt.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                {isWorkspaceConnected ? 'Click Refresh to load calendar events.' : 'Connect Google Workspace to view your calendar schedule.'}
              </div>
            )}
          </div>
        )}

        {/* 5. BROWSER USE & WEB SEARCH */}
        {activeTab === 'browser' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ask Jarvis to research anything on the web (e.g. AI advancements 2026, tech earnings)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBrowserSearch()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                />
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={handleBrowserSearch}
                disabled={loading || !searchQuery}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Research
              </button>
            </div>

            {searchResult && (
              <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-300">Web Research Intelligence</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Query: &ldquo;{searchResult.query}&rdquo;
                  </span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {searchResult.content}
                </div>
                {searchResult.sources && searchResult.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1.5">
                      Grounding Sources & Citations:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {searchResult.sources.map((s: any, idx: number) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[11px] text-cyan-300 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="max-w-[180px] truncate">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
