// voiceTranscriptionAPI.ts

// Configuration - Replace with your actual Groq API key
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  language?: string;
  duration?: number;
  error?: string;
}

export interface VoiceRecordingOptions {
  maxDuration?: number; // in milliseconds, default 30000 (30 seconds)
  mimeType?: string; // default 'audio/webm;codecs=opus'
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onProgress?: (duration: number) => void;
}

// Global recorder management for React component compatibility
let globalMediaRecorder: MediaRecorder | null = null;
let globalStream: MediaStream | null = null;
let recordingStartTime: number = 0;

/**
 * Check if the browser supports audio recording
 */
export function isAudioRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder &&
    MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  );
}

/**
 * Start recording audio from user's microphone
 */
export async function startRecording(
  options: VoiceRecordingOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const {
    mimeType = 'audio/webm;codecs=opus',
    onRecordingStart,
    onProgress
  } = options;

  try {
    // Check if already recording
    if (globalMediaRecorder && globalMediaRecorder.state === 'recording') {
      return { success: false, error: 'Recording already in progress' };
    }

    // Check browser support
    if (!isAudioRecordingSupported()) {
      return { success: false, error: 'Audio recording not supported in this browser' };
    }

    // Get user media with optimized settings for speech
    globalStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000, // Whisper works well with 16kHz
        channelCount: 1 // Mono audio
      }
    });

    // Create MediaRecorder
    globalMediaRecorder = new MediaRecorder(globalStream, { 
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm'
    });

    // Set up progress tracking
    recordingStartTime = Date.now();
    let progressInterval: NodeJS.Timeout | null = null;

    if (onProgress) {
      progressInterval = setInterval(() => {
        const duration = Date.now() - recordingStartTime;
        onProgress(duration);
      }, 100);
    }

    // Clean up on stop
    globalMediaRecorder.onstop = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (globalStream) {
        globalStream.getTracks().forEach(track => track.stop());
        globalStream = null;
      }
    };

    // Start recording
    globalMediaRecorder.start(100); // Collect data every 100ms
    onRecordingStart?.();

    return { success: true };

  } catch (error) {
    // Clean up on error
    if (globalStream) {
      globalStream.getTracks().forEach(track => track.stop());
      globalStream = null;
    }
    globalMediaRecorder = null;

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start recording'
    };
  }
}

/**
 * Stop recording and get the transcription
 */
export async function stopRecordingAndTranscribe(
  options: VoiceRecordingOptions = {}
): Promise<TranscriptionResult> {
  const { onRecordingStop } = options;

  return new Promise((resolve) => {
    if (!globalMediaRecorder || globalMediaRecorder.state !== 'recording') {
      resolve({
        success: false,
        error: 'No active recording found'
      });
      return;
    }

    const audioChunks: Blob[] = [];

    // Collect audio data
    globalMediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Handle recording stop
    globalMediaRecorder.onstop = async () => {
      const duration = Date.now() - recordingStartTime;
      onRecordingStop?.();

      if (audioChunks.length === 0) {
        resolve({
          success: false,
          error: 'No audio data recorded'
        });
        return;
      }

      // Create audio blob
      const audioBlob = new Blob(audioChunks, { 
        type: globalMediaRecorder?.mimeType || 'audio/webm' 
      });

      // Transcribe the audio
      const result = await transcribeAudioBlob(audioBlob);
      resolve({
        ...result,
        duration
      });

      // Clean up
      globalMediaRecorder = null;
    };

    // Stop recording
    globalMediaRecorder.stop();
  });
}

/**
 * One-shot recording and transcription (for simple use cases)
 */
export async function transcribeVoice(
  options: VoiceRecordingOptions = {}
): Promise<TranscriptionResult> {
  const { maxDuration = 30000 } = options;

  try {
    // Start recording
    const startResult = await startRecording(options);
    if (!startResult.success) {
      return {
        success: false,
        error: startResult.error
      };
    }

    // Wait for max duration or manual stop
    await new Promise(resolve => setTimeout(resolve, maxDuration));

    // Stop and transcribe
    return await stopRecordingAndTranscribe(options);

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Recording failed'
    };
  }
}

/**
 * Manual stop for active recording
 */
export async function stopRecording(): Promise<TranscriptionResult> {
  return await stopRecordingAndTranscribe();
}

/**
 * Get current recording state
 */
export function getRecordingState(): 'inactive' | 'recording' | 'paused' {
  if (!globalMediaRecorder) return 'inactive';
  return globalMediaRecorder.state as 'inactive' | 'recording' | 'paused';
}

/**
 * Transcribe an audio blob using Groq's Whisper API
 */
async function transcribeAudioBlob(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    // Validate blob size (Groq has a 25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioBlob.size > maxSize) {
      return {
        success: false,
        error: `Audio file too large (${Math.round(audioBlob.size / 1024 / 1024)}MB). Maximum size is 25MB.`
      };
    }

    // Prepare form data according to Groq's requirements
    const formData = new FormData();
    
    // Convert blob to file with proper extension
    const file = new File([audioBlob], 'audio.webm', { 
      type: audioBlob.type || 'audio/webm' 
    });
    
    formData.append('file', file);
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');
    // No language parameter for auto-detection
    formData.append('temperature', '0'); // For consistent results

    // Make API request
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    const result = await response.json();
    
    // Validate response
    if (!result.text) {
      return {
        success: false,
        error: 'No transcription text received from API'
      };
    }

    return {
      success: true,
      text: result.text.trim(),
      language: result.language || 'unknown',
      duration: result.duration
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transcription failed'
    };
  }
}

/**
 * Transcribe an uploaded audio file
 */
export async function transcribeAudioFile(audioFile: File): Promise<TranscriptionResult> {
  try {
    // Validate file type
    if (!audioFile.type.startsWith('audio/') && !audioFile.name.match(/\.(mp3|wav|m4a|webm|ogg|flac|aac)$/i)) {
      return {
        success: false,
        error: 'Please upload a valid audio file (mp3, wav, m4a, webm, ogg, flac, aac)'
      };
    }

    return await transcribeAudioBlob(audioFile);

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File transcription failed'
    };
  }
}

/**
 * Get human-readable language name from language code
 * Supports all Indian languages that Whisper can detect
 */
export function getLanguageName(languageCode: string): string {
  const languageNames: { [key: string]: string } = {
    // English
    'en': 'English',
    
    // Indian Languages (all languages Whisper supports)
    'hi': 'Hindi', // हिन्दी
    'bn': 'Bengali', // বাংলা  
    'te': 'Telugu', // తెలుగు
    'mr': 'Marathi', // मराठी
    'ta': 'Tamil', // தமிழ்
    'gu': 'Gujarati', // ગુજરાતી
    'kn': 'Kannada', // ಕನ್ನಡ
    'ml': 'Malayalam', // മലയാളം
    'or': 'Odia', // ଓଡ଼ିଆ
    'pa': 'Punjabi', // ਪੰਜਾਬੀ
    'as': 'Assamese', // অসমীয়া
    'ne': 'Nepali', // नेपाली
    'si': 'Sinhala', // සිංහල
    'ur': 'Urdu', // اردو
    'sa': 'Sanskrit', // संस्कृत
    'sd': 'Sindhi', // سنڌي
    
    // Additional South Asian languages
    'my': 'Myanmar', // မြန်မာ
    'lo': 'Lao', // ລາວ
    'th': 'Thai', // ไทย
    'vi': 'Vietnamese', // Tiếng Việt
    'km': 'Khmer', // ខ្មែរ
    
    // Regional codes
    'hi-in': 'Hindi (India)',
    'en-in': 'Indian English',
    'bn-in': 'Bengali (India)',
    'te-in': 'Telugu (India)',
    'ta-in': 'Tamil (India)',
    'gu-in': 'Gujarati (India)',
    'kn-in': 'Kannada (India)',
    'ml-in': 'Malayalam (India)',
    'mr-in': 'Marathi (India)',
    'or-in': 'Odia (India)',
    'pa-in': 'Punjabi (India)',
    'as-in': 'Assamese (India)',
    'ur-in': 'Urdu (India)',
    
    // Common fallbacks
    'unknown': 'Language Auto-detected'
  };

  const code = languageCode.toLowerCase();
  return languageNames[code] || 
         languageNames[code.split('-')[0]] || 
         `${languageCode.toUpperCase()} (Auto-detected)`;
}

/**
 * Check if a language is supported by Whisper for Indian subcontinent
 */
export function isSupportedIndianLanguage(languageCode: string): boolean {
  const supportedCodes = [
    'en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'or', 'pa', 'as', 
    'ne', 'si', 'ur', 'sa', 'sd', 'my', 'lo', 'th', 'vi', 'km'
  ];
  
  return supportedCodes.includes(languageCode.toLowerCase().split('-')[0]);
}

/**
 * Get list of supported Indian languages
 */
export function getSupportedLanguages(): Array<{ code: string; name: string; script?: string }> {
  return [
    { code: 'en', name: 'English', script: 'Latin' },
    { code: 'hi', name: 'Hindi', script: 'Devanagari' },
    { code: 'bn', name: 'Bengali', script: 'Bengali' },
    { code: 'te', name: 'Telugu', script: 'Telugu' },
    { code: 'mr', name: 'Marathi', script: 'Devanagari' },
    { code: 'ta', name: 'Tamil', script: 'Tamil' },
    { code: 'gu', name: 'Gujarati', script: 'Gujarati' },
    { code: 'kn', name: 'Kannada', script: 'Kannada' },
    { code: 'ml', name: 'Malayalam', script: 'Malayalam' },
    { code: 'or', name: 'Odia', script: 'Odia' },
    { code: 'pa', name: 'Punjabi', script: 'Gurmukhi' },
    { code: 'as', name: 'Assamese', script: 'Bengali' },
    { code: 'ne', name: 'Nepali', script: 'Devanagari' },
    { code: 'si', name: 'Sinhala', script: 'Sinhala' },
    { code: 'ur', name: 'Urdu', script: 'Arabic' },
    { code: 'sa', name: 'Sanskrit', script: 'Devanagari' },
    { code: 'sd', name: 'Sindhi', script: 'Arabic' }
  ];
}

/**
 * Utility to format transcription result for display
 */
export function formatTranscriptionResult(result: TranscriptionResult): string {
  if (!result.success) {
    return `Error: ${result.error}`;
  }
  
  const langName = result.language ? getLanguageName(result.language) : 'Unknown';
  const duration = result.duration ? ` (${Math.round(result.duration)}s)` : '';
  
  return `[${langName}${duration}] ${result.text}`;
}