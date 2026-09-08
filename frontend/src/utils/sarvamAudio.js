import { API_BASE_URL } from '../config/api';

/**
 * Check if Sarvam AI Voice service is enabled and configured on backend.
 */
export async function checkSarvamStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/sarvam/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Sarvam Status Check Failed]', err);
  }
  return { enabled: false, supported_languages: [] };
}

/**
 * Helper class/function to record user voice via MediaRecorder API
 * and send recorded audio to Sarvam STT backend endpoint.
 */
export class SarvamVoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
  }

  /**
   * Start recording voice audio from browser microphone.
   */
  async startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone access is not supported in this browser.");
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];

      // Determine supported MIME type for recorder
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // collect 100ms chunks
      this.isRecording = true;
    } catch (err) {
      this.cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error("Microphone permission is required for voice input.");
      }
      throw new Error("Could not access microphone. Please try again.");
    }
  }

  /**
   * Stop recording and send audio blob to Sarvam STT backend endpoint.
   * Returns: Promise<{ transcript: string, language_code: string }>
   */
  async stopAndTranscribe(language = 'auto') {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error("No active recording session.");
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
          const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          this.cleanup();

          if (audioBlob.size === 0) {
            reject(new Error("Recorded audio is empty. Please speak louder and try again."));
            return;
          }

          // Build FormData for FastAPI backend endpoint
          const formData = new FormData();
          formData.append('file', audioBlob, `recorded_voice.${extension}`);
          formData.append('language', language);

          const response = await fetch(`${API_BASE_URL}/sarvam/stt`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            reject(new Error(errData.detail || "Voice service is temporarily unavailable. You can continue using text chat."));
            return;
          }

          const result = await response.json();
          resolve(result);
        } catch (err) {
          this.cleanup();
          reject(err);
        }
      };

      try {
        this.mediaRecorder.stop();
        this.isRecording = false;
      } catch (err) {
        this.cleanup();
        reject(err);
      }
    });
  }

  /**
   * Cancel and cleanup media stream cleanly.
   */
  cleanup() {
    this.isRecording = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

// Active global HTML5 Audio instance for single playback management
let currentAudioInstance = null;

/**
 * Synthesize text into speech using Sarvam TTS backend endpoint and play in browser.
 * Returns: { stop: Function, audio: HTMLAudioElement }
 */
export async function playSarvamTTS({ text, language = 'Hindi', speaker = 'meera', onStart, onEnd, onError }) {
  // Stop any currently playing Sarvam audio
  stopSarvamTTS();

  try {
    const response = await fetch(`${API_BASE_URL}/sarvam/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language,
        speaker,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.detail || "Unable to play Sarvam voice output.";
      if (onError) onError(new Error(msg));
      return null;
    }

    const data = await response.json();
    if (!data.audio_base64) {
      if (onError) onError(new Error("No audio payload returned from Sarvam TTS."));
      return null;
    }

    const dataUrl = `data:audio/wav;base64,${data.audio_base64}`;
    const audio = new Audio(dataUrl);
    currentAudioInstance = audio;

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      currentAudioInstance = null;
      if (onEnd) onEnd();
    };

    audio.onerror = (e) => {
      currentAudioInstance = null;
      console.warn('[Sarvam Audio Playback Error]', e);
      if (onError) onError(e);
    };

    await audio.play();
    return {
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
        currentAudioInstance = null;
      },
      audio,
    };
  } catch (err) {
    currentAudioInstance = null;
    console.warn('[playSarvamTTS Exception]', err);
    if (onError) onError(err);
    return null;
  }
}

/**
 * Stop any ongoing Sarvam Audio playback cleanly.
 */
export function stopSarvamTTS() {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentAudioInstance = null;
  }
}
