export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface DeepgramConfig {
  apiKey: string;
  voiceModel: string; // e.g. aura-helios-en, aura-asteria-en, aura-arcas-en, aura-luna-en
  systemPrompt: string;
  enableVoiceAgent: boolean;
  sampleRate: number;
}

export type StepStatus = 'pending' | 'running' | 'approval_required' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: string;
  title: string;
  tool: string; // e.g. 'gmail.list', 'gmail.send', 'drive.list', 'sheets.append', 'calendar.create', 'browser.search', 'artifact.create'
  params: Record<string, any>;
  requiresConfirmation?: boolean;
  rationale?: string;
  status: StepStatus;
  output?: any;
  error?: string;
  approvalGranted?: boolean;
}

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  summary?: string;
  status: 'planning' | 'running' | 'approval_required' | 'completed' | 'failed';
  steps: WorkflowStep[];
  activeStepIndex: number;
  createdAt: number;
  completedAt?: number;
}

export interface DataColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface KeyMetric {
  label: string;
  value: string;
  trend?: string;
  status?: 'positive' | 'neutral' | 'negative';
}

export interface Dataset {
  id: string;
  name: string;
  type: 'tabular' | 'json' | 'diagram' | 'timeseries' | 'metrics';
  columns: DataColumn[];
  rows: Record<string, any>[];
  rawText?: string;
  chartConfig?: {
    chartType: 'bar' | 'line' | 'area' | 'pie' | 'composed';
    xAxisKey: string;
    dataKeys: string[];
  };
  analysis?: {
    summary: string;
    keyMetrics: KeyMetric[];
    insights: string[];
  };
}

export interface ArtifactVersion {
  id: string;
  artifactId: string;
  versionNumber: number;
  content: string;
  timestamp: number;
  author: {
    name: string;
    role: 'user' | 'agent' | 'workflow';
    avatar?: string;
    color?: string;
  };
  summary: string;
  wordCount: number;
}

export interface Artifact {
  id: string;
  title: string;
  type: 'report' | 'document' | 'table' | 'visualization' | 'json' | 'diagram' | 'email_draft' | 'calendar_invitation' | 'research';
  content: string;
  createdAt: number;
  metadata?: Record<string, any>;
  dataset?: Dataset;
  versions?: ArtifactVersion[];
  currentVersionNumber?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  timestamp: number;
  workflowId?: string;
  artifactId?: string;
  audioUrl?: string;
}

export interface ConfirmationRequest {
  id: string;
  stepId: string;
  tool: string;
  title: string;
  description: string;
  details: Record<string, any>;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}
