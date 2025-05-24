// voiceTranscriptionAPI.ts

// Hardcoded API key (replace with your actual Groq API key)
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export interface VoiceRecordingOptions {
  maxDuration?: number; // in milliseconds, default 30000 (30 seconds)
  mimeType?: string; // default 'audio/webm'
}

/**
 * Records audio from user's microphone and transcribes it using Groq's Whisper API
 * @param options - Optional configuration for recording
 * @returns Promise<TranscriptionResult> - The transcribed text or error
 */
export async function transcribeVoice(
  options: VoiceRecordingOptions = {}
): Promise<TranscriptionResult> {
  const {
    maxDuration = 30000, // 30 seconds default
    mimeType = 'audio/webm'
  } = options;

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];

  try {
    // Check if browser supports necessary APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Audio recording not supported in this browser');
    }

    // Get user media (microphone access)
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      } 
    });

    // Create MediaRecorder instance
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    audioChunks = [];

    // Set up event handlers
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Start recording
    mediaRecorder.start();

    // Wait for recording to complete (either by user stopping or max duration)
    const audioBlob = await new Promise<Blob>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, maxDuration);

      mediaRecorder!.onstop = () => {
        clearTimeout(timeout);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
        
        if (audioChunks.length === 0) {
          reject(new Error('No audio data recorded'));
          return;
        }
        
        const blob = new Blob(audioChunks, { type: mimeType });
        resolve(blob);
      };

      mediaRecorder!.onerror = (error) => {
        clearTimeout(timeout);
        stream.getTracks().forEach(track => track.stop());
        reject(error);
      };
    });

    // Convert audio blob to transcription
    const transcription = await transcribeAudioBlob(audioBlob);
    return transcription;

  } catch (error) {
    // Clean up media recorder and stream if they exist
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Manually stop recording if it's in progress
 * This can be called from the component to stop recording before maxDuration
 */
export function stopRecording(): void {
  // This function would need to be enhanced to work with a global recorder instance
  // For now, it's a placeholder - you might want to implement a more sophisticated
  // recording management system if you need manual stop functionality
  console.log('Manual stop requested - implement global recorder management if needed');
}

/**
 * Transcribe an audio blob using Groq's Whisper API
 * @param audioBlob - The audio data to transcribe
 * @returns Promise<TranscriptionResult> - The transcribed text or error
 */
async function transcribeAudioBlob(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    // Prepare form data for the API request
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en'); // You can make this configurable
    formData.append('response_format', 'json');

    // Make API request to Groq
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.text) {
      throw new Error('No transcription text received from API');
    }

    return {
      success: true,
      text: result.text.trim()
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transcription failed'
    };
  }
}

/**
 * Utility function to check if the browser supports audio recording
 * @returns boolean - Whether audio recording is supported
 */
export function isAudioRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  );
}

/**
 * Alternative function that accepts an audio file directly (for file uploads)
 * @param audioFile - File object containing audio data
 * @returns Promise<TranscriptionResult> - The transcribed text or error
 */
export async function transcribeAudioFile(audioFile: File): Promise<TranscriptionResult> {
  try {
    if (!audioFile.type.startsWith('audio/')) {
      throw new Error('File must be an audio file');
    }

    const transcription = await transcribeAudioBlob(audioFile);
    return transcription;

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File transcription failed'
    };
  }
}