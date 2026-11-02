import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  VoiceState,
  DeepgramConfig,
  WorkflowTask,
  WorkflowStep,
  Artifact,
  ArtifactVersion,
  ChatMessage,
  ConfirmationRequest,
} from './types';
import { initAuth, googleSignIn, logout, getCurrentUser, setAccessToken } from './services/workspaceAuth';
import {
  loadDeepgramConfig,
  saveDeepgramConfig,
  speakWithDeepgramAura,
  DeepgramVoiceAgentSession,
} from './services/deepgramService';
import { CoworkEngine } from './services/coworkRunner';
import { driveService, sheetsService } from './services/workspaceApi';
import { Dataset } from './types';

// Components
import { Header } from './components/Header';
import { WorkflowTimeline } from './components/WorkflowTimeline';
import { CanvasWorkspace } from './components/canvas/CanvasWorkspace';
import { WorkspaceHub } from './components/WorkspaceHub';
import { DestructiveConfirmModal } from './components/DestructiveConfirmModal';
import { DeepgramSettingsModal } from './components/DeepgramSettingsModal';

// Icons
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Layers,
  FileText,
  Boxes,
  Compass,
  Bot,
  User as UserIcon,
  Volume2,
  Check,
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Deepgram Configuration & Voice Agent
  const [deepgramConfig, setDeepgramConfig] = useState<DeepgramConfig>(loadDeepgramConfig());
  const [isDeepgramModalOpen, setIsDeepgramModalOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const deepgramSessionRef = useRef<DeepgramVoiceAgentSession | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Canvas State
  const [coworkTab, setCoworkTab] = useState<'canvas' | 'workflow' | 'workspace'>('canvas');

  // Workflow State
  const [currentTask, setCurrentTask] = useState<WorkflowTask | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);

  // Destructive Confirmation Modal
  const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Intercom / Chat Stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_initial',
      sender: 'jarvis',
      text: 'Good day. Jarvis autonomous cowork engine initialized. I am connected and standing by to execute multi-step workflows across your Gmail, Google Drive, Sheets, Calendar, and live web research.',
      timestamp: Date.now(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize Workspace Auth listener on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, authedToken) => {
        setUser({
          uid: authedUser.uid,
          email: authedUser.email,
          displayName: authedUser.displayName,
          photoURL: authedUser.photoURL,
        });
        if (authedToken) {
          setToken(authedToken);
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Auto-scroll chat stream
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Google Workspace Sign-In Handler
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser({
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
        });
        setToken(res.accessToken);
        addJarvisMessage(
          `Google Workspace connected successfully for ${res.user.email}. Gmail, Drive, Sheets, and Calendar capabilities are fully unlocked.`
        );
      }
    } catch (err: any) {
      console.error('Google login failed:', err);
      addJarvisMessage(`Authentication failed: ${err.message || 'Please check popup settings.'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    addJarvisMessage('Google Workspace disconnected.');
  };

  // Jarvis Vocalizer (speaks response via Deepgram Aura or fallback)
  const speakJarvisResponse = async (text: string) => {
    setVoiceState('speaking');
    try {
      if (deepgramConfig.apiKey) {
        await speakWithDeepgramAura(text, deepgramConfig.apiKey, deepgramConfig.voiceModel);
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 0.95; // slightly lower Jarvis cadence
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Speech synthesis notice:', err);
    } finally {
      setVoiceState('idle');
    }
  };

  // Append message to conversation
  const addJarvisMessage = (text: string, artifactId?: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'jarvis',
        text,
        timestamp: Date.now(),
        artifactId,
      },
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'user',
        text,
        timestamp: Date.now(),
      },
    ]);
  };

  // Autonomous Task Planner & Executor
  const initiateTaskWorkflow = async (promptText: string) => {
    if (!promptText.trim()) return;

    addUserMessage(promptText);
    setInputPrompt('');
    setVoiceState('thinking');

    try {
      // 1. Plan workflow steps
      const task = await CoworkEngine.planWorkflow(promptText, Boolean(token));
      setCurrentTask(task);
      setCoworkTab('workflow');

      if (task.summary) {
        addJarvisMessage(task.summary);
        speakJarvisResponse(task.summary);
      }

      // 2. Start running steps
      await runTaskWorkflow(task, promptText);
    } catch (err: any) {
      console.error('Task execution error:', err);
      addJarvisMessage(`Workflow error encountered: ${err.message || 'Execution halted'}`);
      setVoiceState('error');
    }
  };

  // Sequential Step Runner Loop
  const runTaskWorkflow = async (task: WorkflowTask, promptText: string) => {
    const outputs: Record<string, any> = {};

    for (let i = 0; i < task.steps.length; i++) {
      const step = task.steps[i];

      // Update current step to running
      setCurrentTask((prev) => {
        if (!prev) return prev;
        const newSteps = [...prev.steps];
        newSteps[i] = { ...newSteps[i], status: 'running' };
        return { ...prev, activeStepIndex: i, steps: newSteps, status: 'running' };
      });

      // CHECK MANDATORY WORKSPACE CONFIRMATION GATE
      if (step.requiresConfirmation && !step.approvalGranted) {
        setCurrentTask((prev) => {
          if (!prev) return prev;
          const newSteps = [...prev.steps];
          newSteps[i] = { ...newSteps[i], status: 'approval_required' };
          return { ...prev, status: 'approval_required', steps: newSteps };
        });

        // Halt and wait for user confirmation
        await new Promise<void>((resolve) => {
          setConfirmationRequest({
            id: `confirm_${step.id}`,
            stepId: step.id,
            tool: step.tool,
            title: `Approve: ${step.title}`,
            description: step.rationale || 'Jarvis requires your confirmation to execute this action.',
            details: step.params,
            onConfirm: () => {
              setIsConfirmModalOpen(false);
              setConfirmationRequest(null);
              step.approvalGranted = true;
              resolve();
            },
            onCancel: () => {
              setIsConfirmModalOpen(false);
              setConfirmationRequest(null);
              step.status = 'skipped';
              resolve();
            },
          });
          setIsConfirmModalOpen(true);
        });

        if (step.status === 'skipped') {
          addJarvisMessage(`Step "${step.title}" was skipped per your request.`);
          continue;
        }
      }

      try {
        // Execute tool step
        const result = await CoworkEngine.executeStep(step, {
          isWorkspaceConnected: Boolean(token),
          userPrompt: promptText,
          previousOutputs: outputs,
        });

        outputs[step.id] = result.output;

        // If an artifact was synthesized, add to live Cowork Canvas with initial version
        if (result.artifact) {
          const initialVersion: ArtifactVersion = {
            id: `v1_${result.artifact.id}`,
            artifactId: result.artifact.id,
            versionNumber: 1,
            content: result.artifact.content,
            timestamp: result.artifact.createdAt || Date.now(),
            author: {
              name: 'Jarvis Cowork',
              role: 'agent',
              color: '#06b6d4',
            },
            summary: 'Initial automated synthesis by Jarvis Cowork',
            wordCount: result.artifact.content.trim() ? result.artifact.content.trim().split(/\s+/).length : 0,
          };

          const enrichedArtifact: Artifact = {
            ...result.artifact,
            versions: [initialVersion],
            currentVersionNumber: 1,
          };

          setArtifacts((prev) => [enrichedArtifact, ...prev]);
          setActiveArtifactId(enrichedArtifact.id);
          setCoworkTab('canvas');
          addJarvisMessage(`Created new Cowork Artifact: "${enrichedArtifact.title}". Viewable in the Canvas.`);
        }

        // Mark step completed
        setCurrentTask((prev) => {
          if (!prev) return prev;
          const newSteps = [...prev.steps];
          newSteps[i] = { ...newSteps[i], status: 'completed', output: result.output };
          return { ...prev, steps: newSteps };
        });
      } catch (stepErr: any) {
        console.error(`Error executing ${step.tool}:`, stepErr);
        setCurrentTask((prev) => {
          if (!prev) return prev;
          const newSteps = [...prev.steps];
          newSteps[i] = { ...newSteps[i], status: 'failed', error: stepErr.message };
          return { ...prev, status: 'failed', steps: newSteps };
        });
        addJarvisMessage(`Step "${step.title}" failed: ${stepErr.message}. You can retry or re-prompt.`);
        return;
      }
    }

    // Mark entire workflow completed
    setCurrentTask((prev) => (prev ? { ...prev, status: 'completed', completedAt: Date.now() } : null));
    const completionMsg = `Workflow "${task.title}" has completed all automated tasks successfully.`;
    addJarvisMessage(completionMsg);
    speakJarvisResponse(completionMsg);
  };

  // Toggle Microphone / Voice Agent
  const toggleListening = async () => {
    if (isListening) {
      // Stop
      setIsListening(false);
      setVoiceState('idle');
      if (deepgramSessionRef.current) {
        deepgramSessionRef.current.stopListening();
        deepgramSessionRef.current = null;
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
      return;
    }

    // Start listening
    setIsListening(true);
    setVoiceState('listening');
    setTranscript('');

    // If Deepgram API key is configured, use Deepgram Realtime Voice Agent
    if (deepgramConfig.apiKey) {
      try {
        const session = new DeepgramVoiceAgentSession(deepgramConfig, {
          onTranscript: (liveText, isFinal) => {
            setTranscript(liveText);
            if (isFinal && liveText.trim()) {
              setIsListening(false);
              setVoiceState('thinking');
              initiateTaskWorkflow(liveText.trim());
            }
          },
          onError: (err) => {
            console.error('Deepgram session error:', err);
            setIsListening(false);
            setVoiceState('idle');
          },
        });
        deepgramSessionRef.current = session;
        await session.startListening();
        return;
      } catch (err: any) {
        console.warn('Falling back to Web Speech recognition:', err);
      }
    }

    // Browser Speech Recognition Fallback
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          setVoiceState('thinking');
          initiateTaskWorkflow(transcript.trim());
        } else {
          setVoiceState('idle');
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
        setVoiceState('idle');
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } else {
      setIsListening(false);
      setVoiceState('idle');
      alert('Microphone input is supported via Web Speech or Deepgram API key in settings.');
    }
  };

  // Export Artifact to Google Drive
  const handleSaveArtifactToDrive = (artifact: Artifact) => {
    setConfirmationRequest({
      id: `confirm_drive_${artifact.id}`,
      stepId: 'artifact_export_drive',
      tool: 'drive.create',
      title: 'Export Artifact to Google Drive',
      description: `Save "${artifact.title}" as a document file in your Google Drive.`,
      details: {
        'File Name': `${artifact.title.replace(/[^a-z0-9]/gi, '_')}.md`,
        'File Size': `${artifact.content.length} characters`,
      },
      onConfirm: async () => {
        try {
          await driveService.createFile(`${artifact.title}.md`, artifact.content, 'text/markdown');
          addJarvisMessage(`Saved "${artifact.title}" to Google Drive.`);
        } catch (err: any) {
          addJarvisMessage(`Failed to export to Drive: ${err.message}`);
        }
      },
      onCancel: () => {},
    });
    setIsConfirmModalOpen(true);
  };

  const handleUpdateArtifact = (id: string, newContent: string, newVersion?: ArtifactVersion) => {
    setArtifacts((prev) =>
      prev.map((art) => {
        if (art.id !== id) return art;
        const versions = art.versions ? [...art.versions] : [];
        if (newVersion) {
          versions.unshift(newVersion);
        }
        return {
          ...art,
          content: newContent,
          versions,
          currentVersionNumber: newVersion ? newVersion.versionNumber : art.currentVersionNumber || 1,
        };
      })
    );
  };

  // Export Canvas Dataset to Google Sheets (with User Confirmation)
  const handleExportDatasetToGoogleSheets = (dataset: Dataset) => {
    if (!token) {
      handleGoogleLogin();
      return;
    }

    setConfirmationRequest({
      id: `confirm_export_sheets_${Date.now()}`,
      stepId: 'export_sheets',
      tool: 'sheets.create',
      title: `Export "${dataset.name}" to Google Sheets`,
      description: `Jarvis will create a new spreadsheet on your Google Drive and populate ${dataset.rows.length} rows with ${dataset.columns.length} columns.`,
      details: {
        'Spreadsheet Title': dataset.name,
        'Rows to Write': dataset.rows.length,
        'Headers': dataset.columns.map((c) => c.label).join(', '),
      },
      onConfirm: async () => {
        try {
          const headers = dataset.columns.map((c) => c.label);
          const res = await sheetsService.createSpreadsheet(dataset.name, headers);
          const rowValues = dataset.rows.map((r) =>
            dataset.columns.map((c) => r[c.key] ?? '')
          );
          if (rowValues.length > 0) {
            await sheetsService.appendRow(res.spreadsheetId, rowValues);
          }
          addJarvisMessage(
            `Successfully created Google Spreadsheet "${dataset.name}" with ${dataset.rows.length} rows.`
          );
        } catch (err: any) {
          addJarvisMessage(`Failed to export to Sheets: ${err.message}`);
        }
      },
      onCancel: () => {},
    });
    setIsConfirmModalOpen(true);
  };

  // Pre-configured Cowork Recipe Chips
  const presetPrompts = [
    {
      label: '🌅 Morning Briefing',
      query: 'Check today’s calendar events and search latest AI tech news to draft an executive morning briefing.',
    },
    {
      label: '📊 Sheets Research Pipeline',
      query: 'Search top 5 enterprise cloud databases with pricing, create a comparison matrix, and prepare a Google Sheet.',
    },
    {
      label: '📧 Inbox Zero Scan',
      query: 'Query recent emails in Gmail, identify action items, and draft concise follow-up responses for review.',
    },
    {
      label: '📅 Schedule Sync',
      query: 'Check calendar availability for this week and prepare a proposed meeting schedule for the engineering sync.',
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <Header
        user={user}
        hasToken={Boolean(token)}
        isLoggingIn={isLoggingIn}
        deepgramConfig={deepgramConfig}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onOpenDeepgramSettings={() => setIsDeepgramModalOpen(true)}
      />

      {/* Main Body: Split Chat & Canvas View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 gap-3">
          {/* Left Pane: Jarvis Intercom & Conversation */}
          <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shrink-0">
            {/* Voice Status Banner */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Jarvis Voice Intercom
                    {voiceState === 'speaking' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {isListening
                      ? 'Listening to speech...'
                      : voiceState === 'thinking'
                      ? 'Synthesizing workflow...'
                      : voiceState === 'speaking'
                      ? 'Vocalizing reply...'
                      : deepgramConfig.apiKey
                      ? 'Deepgram Aura Voice Ready'
                      : 'Mic Ready (Web Speech)'}
                  </div>
                </div>
              </div>

              {transcript && (
                <div className="max-w-[160px] truncate text-[10px] text-cyan-300 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                  {transcript}
                </div>
              )}
            </div>

            {/* Chat / Workflow Logs Stream */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((msg) => {
                const isJarvis = msg.sender === 'jarvis';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isJarvis ? 'justify-start' : 'justify-end'}`}
                  >
                    {isJarvis && (
                      <div className="w-6 h-6 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isJarvis
                          ? 'bg-slate-950/90 text-slate-200 border border-slate-800/90 shadow-sm'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/10'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-white/10 text-[9px] opacity-60 font-mono">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isJarvis && (
                          <button
                            onClick={() => speakJarvisResponse(msg.text)}
                            className="hover:opacity-100 flex items-center gap-1 cursor-pointer"
                            title="Replay voice audio"
                          >
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                            Read
                          </button>
                        )}
                      </div>
                    </div>
                    {!isJarvis && (
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Prompt Quick Chips */}
            <div className="px-3 py-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {presetPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => initiateTaskWorkflow(p.query)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Bottom Command Input Bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  initiateTaskWorkflow(inputPrompt);
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  placeholder="Ask Jarvis to orchestrate a workflow or search..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 pr-20 text-xs text-white placeholder:text-slate-500 outline-none"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isListening
                        ? 'bg-cyan-500 text-slate-950 animate-pulse'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Voice command"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim()}
                    className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-40 cursor-pointer shadow-sm shadow-cyan-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Pane: Canvas */}
          <div className="flex-1 flex flex-col bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden min-w-0">
            {/* Cowork Canvas Tabs Header */}
            <div className="h-12 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCoworkTab('canvas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    coworkTab === 'canvas'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Canvas</span>
                  {artifacts.length ? (
                    <span className="text-[10px] font-mono px-1.5 rounded-full bg-cyan-500/30 text-cyan-200">
                      {artifacts.length}
                    </span>
                  ) : null}
                </button>

                <button
                  onClick={() => setCoworkTab('workflow')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    coworkTab === 'workflow'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Workflow Pipeline</span>
                  {currentTask?.steps?.length ? (
                    <span className="text-[10px] font-mono px-1.5 rounded-full bg-slate-800 text-slate-300">
                      {currentTask.steps.length}
                    </span>
                  ) : null}
                </button>

                <button
                  onClick={() => setCoworkTab('workspace')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    coworkTab === 'workspace'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Workspace & Browser Hub</span>
                </button>
              </div>
            </div>

            {/* Canvas View Content */}
            <div className="flex-1 p-3 overflow-hidden">
              {coworkTab === 'canvas' && (
                <CanvasWorkspace
                  artifacts={artifacts}
                  activeArtifactId={activeArtifactId}
                  onSelectArtifact={setActiveArtifactId}
                  onSaveToDrive={handleSaveArtifactToDrive}
                  onExportToGoogleSheets={handleExportDatasetToGoogleSheets}
                  onUpdateArtifact={handleUpdateArtifact}
                  currentUser={user}
                />
              )}

              {coworkTab === 'workflow' && (
                <WorkflowTimeline
                  task={currentTask}
                  onApproveStep={(step) => {
                    if (confirmationRequest && confirmationRequest.stepId === step.id) {
                      setIsConfirmModalOpen(true);
                    }
                  }}
                />
              )}

              {coworkTab === 'workspace' && (
                <WorkspaceHub
                  isWorkspaceConnected={Boolean(token)}
                  onRequestConfirmation={(req) => {
                    setConfirmationRequest(req);
                    setIsConfirmModalOpen(true);
                  }}
                  onInitiateLogin={handleGoogleLogin}
                />
              )}
            </div>
          </div>
        </div>

      {/* Mandatory User Confirmation Modal for Mutating Workspace Operations */}
      <DestructiveConfirmModal
        request={confirmationRequest}
        isOpen={isConfirmModalOpen}
        onConfirm={() => confirmationRequest?.onConfirm()}
        onCancel={() => confirmationRequest?.onCancel()}
      />

      {/* Deepgram Voice Agent API Key & Model Settings Modal */}
      <DeepgramSettingsModal
        isOpen={isDeepgramModalOpen}
        config={deepgramConfig}
        onSave={(newCfg) => {
          setDeepgramConfig(newCfg);
          saveDeepgramConfig(newCfg);
          addJarvisMessage(
            `Deepgram voice engine updated. Voice model: ${newCfg.voiceModel}. You can speak to Jarvis anytime.`
          );
        }}
        onClose={() => setIsDeepgramModalOpen(false)}
      />
    </div>
  );
}
