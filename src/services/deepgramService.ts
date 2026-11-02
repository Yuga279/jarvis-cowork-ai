import { DeepgramConfig } from '../types';

const STORAGE_KEY_DEEPGRAM = 'jarvis_deepgram_config';

export const DEFAULT_DEEPGRAM_CONFIG: DeepgramConfig = {
  apiKey: '',
  voiceModel: 'aura-helios-en', // Jarvis style crisp authoritative voice
  systemPrompt: 'You are Jarvis, an autonomous AI executive coworker. You speak concisely, intelligently, and help the user execute automated workflows across Google Workspace and the web.',
  enableVoiceAgent: true,
  sampleRate: 16000,
};

export const loadDeepgramConfig = (): DeepgramConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEEPGRAM);
    if (raw) {
      return { ...DEFAULT_DEEPGRAM_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load Deepgram config:', err);
  }
  return DEFAULT_DEEPGRAM_CONFIG;
};

export const saveDeepgramConfig = (config: DeepgramConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY_DEEPGRAM, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Deepgram config:', err);
  }
};

// Deepgram Aura Text-to-Speech
export const speakWithDeepgramAura = async (
  text: string,
  apiKey: string,
  model = 'aura-helios-en'
): Promise<HTMLAudioElement> => {
  if (!apiKey) {
    throw new Error('Deepgram API key is required for Aura TTS');
  }

  const res = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Deepgram TTS failed (${res.status}): ${errText}`);
  }

  const audioBlob = await res.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  await audio.play();
  return audio;
};

// Deepgram Voice Agent WebSocket Connection Manager
export class DeepgramVoiceAgentSession {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private config: DeepgramConfig;
  private onTranscriptCallback?: (text: string, isFinal: boolean) => void;
  private onAgentTextCallback?: (text: string) => void;
  private onErrorCallback?: (err: Error) => void;
  private onStatusChangeCallback?: (status: 'connected' | 'connecting' | 'disconnected') => void;

  constructor(
    config: DeepgramConfig,
    callbacks: {
      onTranscript?: (text: string, isFinal: boolean) => void;
      onAgentText?: (text: string) => void;
      onError?: (err: Error) => void;
      onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected') => void;
    }
  ) {
    this.config = config;
    this.onTranscriptCallback = callbacks.onTranscript;
    this.onAgentTextCallback = callbacks.onAgentText;
    this.onErrorCallback = callbacks.onError;
    this.onStatusChangeCallback = callbacks.onStatusChange;
  }

  async startListening(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Deepgram API key is missing. Please enter your key in settings.');
    }

    try {
      this.onStatusChangeCallback?.('connecting');
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: this.config.sampleRate || 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Connect to Deepgram Real-Time transcription endpoint
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&interim_results=true&encoding=linear16&sample_rate=16000`;
      this.ws = new WebSocket(wsUrl, ['token', this.config.apiKey.trim()]);

      this.ws.onopen = () => {
        this.onStatusChangeCallback?.('connected');
        this.startAudioStreaming();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          const isFinal = data.is_final;
          if (transcript && transcript.trim()) {
            this.onTranscriptCallback?.(transcript, isFinal);
          }
        } catch {
          // Non-JSON binary or control frame
        }
      };

      this.ws.onerror = (e) => {
        console.error('Deepgram WebSocket error:', e);
        this.onErrorCallback?.(new Error('Deepgram voice connection error'));
      };

      this.ws.onclose = () => {
        this.onStatusChangeCallback?.('disconnected');
        this.cleanup();
      };
    } catch (err: any) {
      this.onStatusChangeCallback?.('disconnected');
      this.cleanup();
      throw err;
    }
  }

  private startAudioStreaming() {
    if (!this.audioStream || !this.ws) return;

    try {
      // Use AudioContext + ScriptProcessor or MediaRecorder
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(this.audioStream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert Float32 to 16-bit PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          this.ws.send(pcmData.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.warn('AudioContext streaming fallback to MediaRecorder', err);
    }
  }

  stopListening() {
    this.cleanup();
  }

  private cleanup() {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
  }
}
