// voiceTranscriptionAPI.ts

// Hardcoded API key (replace with your actual Groq API key)
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  language?: string; // Detected language code
  languageName?: string; // Human-readable language name
  confidence?: number; // Confidence score if available
  duration?: number; // Duration of audio in seconds
  error?: string;
}

export interface VoiceRecordingOptions {
  maxDuration?: number; // in milliseconds, default 30000 (30 seconds)
  autoStop?: boolean; // Auto-stop after maxDuration, default true
  onStatusChange?: (status: RecordingStatus) => void; // Callback for status updates
}

export type RecordingStatus = 'idle' | 'requesting-permission' | 'recording' | 'stopping' | 'processing' | 'completed' | 'error';

// Global recorder management
let globalMediaRecorder: MediaRecorder | null = null;
let globalStream: MediaStream | null = null;
let recordingStatus: RecordingStatus = 'idle';
let statusCallback: ((status: RecordingStatus) => void) | null = null;

/**
 * Records audio from user's microphone and transcribes it using Groq's Whisper API
 * with automatic language detection for all supported languages
 * @param options - Optional configuration for recording
 * @returns Promise<TranscriptionResult> - The transcribed text, detected language, or error
 */
export async function transcribeVoice(
  options: VoiceRecordingOptions = {}
): Promise<TranscriptionResult> {
  const {
    maxDuration = 30000, // 30 seconds default
    autoStop = true,
    onStatusChange
  } = options;

  statusCallback = onStatusChange || null;
  
  try {
    setRecordingStatus('requesting-permission');

    // Check browser compatibility
    if (!isAudioRecordingSupported()) {
      throw new Error('Audio recording not supported in this browser');
    }

    // Clean up any existing recording
    await stopRecording();

    // Request microphone access with optimized settings for speech
    globalStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000, // Optimal for speech recognition
        channelCount: 1, // Mono audio is sufficient for speech
      } 
    });

    // Use audio/wav for better compatibility with Whisper
    const mimeType = getSupportedMimeType();
    globalMediaRecorder = new MediaRecorder(globalStream, { 
      mimeType,
      audioBitsPerSecond: 64000 // Optimal bitrate for speech
    });

    const audioChunks: Blob[] = [];

    // Set up event handlers
    globalMediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    setRecordingStatus('recording');

    // Start recording
    globalMediaRecorder.start(100); // Collect data every 100ms

    // Set up auto-stop timer if enabled
    let autoStopTimeout: NodeJS.Timeout | null = null;
    if (autoStop) {
      autoStopTimeout = setTimeout(async () => {
        await stopRecording();
      }, maxDuration);
    }

    // Wait for recording to complete
    const audioBlob = await new Promise<Blob>((resolve, reject) => {
      if (!globalMediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      globalMediaRecorder.onstop = () => {
        if (autoStopTimeout) {
          clearTimeout(autoStopTimeout);
        }
        
        if (audioChunks.length === 0) {
          reject(new Error('No audio data recorded'));
          return;
        }
        
        // Convert to wav format for better Whisper compatibility
        const blob = new Blob(audioChunks, { type: mimeType });
        resolve(blob);
      };

      globalMediaRecorder.onerror = (error) => {
        if (autoStopTimeout) {
          clearTimeout(autoStopTimeout);
        }
        reject(error);
      };
    });

    setRecordingStatus('processing');

    // Convert audio blob to transcription
    const transcription = await transcribeAudioBlob(audioBlob);
    
    setRecordingStatus('completed');
    return transcription;

  } catch (error) {
    setRecordingStatus('error');
    await cleanupRecording();

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Manually stop recording if it's in progress
 * @returns Promise<void>
 */
export async function stopRecording(): Promise<void> {
  if (globalMediaRecorder && globalMediaRecorder.state === 'recording') {
    setRecordingStatus('stopping');
    globalMediaRecorder.stop();
    
    // Wait a bit for the stop event to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  await cleanupRecording();
}

/**
 * Get current recording status
 * @returns RecordingStatus
 */
export function getRecordingStatus(): RecordingStatus {
  return recordingStatus;
}

/**
 * Check if currently recording
 * @returns boolean
 */
export function isRecording(): boolean {
  return recordingStatus === 'recording';
}

/**
 * Clean up recording resources
 */
async function cleanupRecording(): Promise<void> {
  if (globalStream) {
    globalStream.getTracks().forEach(track => track.stop());
    globalStream = null;
  }
  
  globalMediaRecorder = null;
  
  if (recordingStatus !== 'completed' && recordingStatus !== 'error') {
    setRecordingStatus('idle');
  }
}

/**
 * Set recording status and notify callback
 */
function setRecordingStatus(status: RecordingStatus): void {
  recordingStatus = status;
  if (statusCallback) {
    statusCallback(status);
  }
}

/**
 * Get the best supported MIME type for recording
 * @returns string - Optimal MIME type for Whisper
 */
function getSupportedMimeType(): string {
  // Whisper works best with these formats, in order of preference
  const preferredTypes = [
    'audio/wav',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ];

  for (const type of preferredTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Fallback to default
  return 'audio/webm';
}

/**
 * Transcribe an audio blob using Groq's Whisper API with automatic language detection
 * @param audioBlob - The audio data to transcribe
 * @returns Promise<TranscriptionResult> - The transcribed text, detected language, or error
 */
async function transcribeAudioBlob(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    // Prepare form data for the API request
    const formData = new FormData();
    
    // Convert blob to appropriate format if needed
    const processedBlob = await convertAudioIfNeeded(audioBlob);
    formData.append('file', processedBlob, getOptimalFileName(processedBlob.type));
    
    // Use the latest Whisper model available on Groq
    formData.append('model', 'whisper-large-v3-turbo');
    
    // Enable automatic language detection by not specifying language
    // Whisper will auto-detect among all supported languages including Indian languages
    formData.append('response_format', 'verbose_json');
    
    // Optional: Set temperature for more consistent results
    formData.append('temperature', '0');

    // Make API request to Groq
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Groq API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.error?.message || errorData.message || 'Unknown error'}`;
      } catch {
        const errorText = await response.text();
        errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.text || result.text.trim().length === 0) {
      throw new Error('No speech detected in audio. Please try speaking more clearly.');
    }

    const detectedLanguage = result.language || 'unknown';
    const languageName = getLanguageName(detectedLanguage);

    return {
      success: true,
      text: result.text.trim(),
      language: detectedLanguage,
      languageName: languageName,
      duration: result.duration,
      confidence: result.confidence // If provided by the API
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transcription failed'
    };
  }
}

/**
 * Convert audio blob to optimal format for Whisper if needed
 * @param audioBlob - Original audio blob
 * @returns Promise<Blob> - Processed audio blob
 */
async function convertAudioIfNeeded(audioBlob: Blob): Promise<Blob> {
  // For now, return as-is. In a full implementation, you might want to
  // convert to WAV or other optimal format using Web Audio API
  return audioBlob;
}

/**
 * Get optimal filename based on MIME type
 * @param mimeType - MIME type of the audio
 * @returns string - Filename with appropriate extension
 */
function getOptimalFileName(mimeType: string): string {
  if (mimeType.includes('wav')) return 'audio.wav';
  if (mimeType.includes('mp4')) return 'audio.mp4';
  if (mimeType.includes('ogg')) return 'audio.ogg';
  if (mimeType.includes('webm')) return 'audio.webm';
  return 'audio.wav'; // Default
}

/**
 * Utility function to check if the browser supports audio recording
 * @returns boolean - Whether audio recording is supported
 */
export function isAudioRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder &&
    MediaRecorder.isTypeSupported
  );
}

/**
 * Alternative function that accepts an audio file directly (for file uploads)
 * @param audioFile - File object containing audio data
 * @returns Promise<TranscriptionResult> - The transcribed text, detected language, or error
 */
export async function transcribeAudioFile(audioFile: File): Promise<TranscriptionResult> {
  try {
    if (!audioFile.type.startsWith('audio/')) {
      throw new Error('File must be an audio file');
    }

    // Check file size (Groq has limits, typically 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      throw new Error('Audio file is too large. Maximum size is 25MB.');
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

/**
 * Get human-readable language name from language code
 * Supports all languages that Whisper can detect including Indian languages
 * @param languageCode - ISO language code (e.g., 'en', 'hi', 'ta')
 * @returns string - Human-readable language name
 */
export function getLanguageName(languageCode: string): string {
  const languageNames: { [key: string]: string } = {
    // English
    'en': 'English',
    
    // Indian Languages (officially supported by Whisper)
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
    
    // Other major languages supported by Whisper
    'ar': 'Arabic',
    'zh': 'Chinese',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'es': 'Spanish',
    'th': 'Thai',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    
    // Additional Indian language variants
    'bho': 'Bhojpuri',
    'mai': 'Maithili',
    'sd': 'Sindhi',
    
    'unknown': 'Unknown Language'
  };

  const code = languageCode.toLowerCase().split('-')[0]; // Handle variants like 'hi-IN'
  return languageNames[code] || languageNames[languageCode.toLowerCase()] || languageCode.toUpperCase();
}

/**
 * Check if a detected language is an Indian language
 * @param languageCode - ISO language code
 * @returns boolean - Whether the language is Indian
 */
export function isIndianLanguage(languageCode: string): boolean {
  const indianLanguages = [
    'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'or', 'pa', 'as', 
    'ne', 'si', 'ur', 'sa', 'bho', 'mai', 'sd'
  ];
  
  const code = languageCode.toLowerCase().split('-')[0];
  return indianLanguages.includes(code);
}

/**
 * Get list of all supported Indian languages plus English
 * @returns Array of language objects with code and name
 */
export function getSupportedLanguages(): Array<{ code: string; name: string; isIndian: boolean }> {
  return [
    { code: 'en', name: 'English', isIndian: false },
    { code: 'hi', name: 'Hindi', isIndian: true },
    { code: 'bn', name: 'Bengali', isIndian: true },
    { code: 'te', name: 'Telugu', isIndian: true },
    { code: 'mr', name: 'Marathi', isIndian: true },
    { code: 'ta', name: 'Tamil', isIndian: true },
    { code: 'gu', name: 'Gujarati', isIndian: true },
    { code: 'kn', name: 'Kannada', isIndian: true },
    { code: 'ml', name: 'Malayalam', isIndian: true },
    { code: 'or', name: 'Odia', isIndian: true },
    { code: 'pa', name: 'Punjabi', isIndian: true },
    { code: 'as', name: 'Assamese', isIndian: true },
    { code: 'ne', name: 'Nepali', isIndian: true },
    { code: 'si', name: 'Sinhala', isIndian: true },
    { code: 'ur', name: 'Urdu', isIndian: true },
    { code: 'sa', name: 'Sanskrit', isIndian: true },
    { code: 'bho', name: 'Bhojpuri', isIndian: true },
    { code: 'mai', name: 'Maithili', isIndian: true },
    { code: 'sd', name: 'Sindhi', isIndian: true }
  ];
}

/**
 * Get supported audio file formats for upload
 * @returns Array of supported MIME types
 */
export function getSupportedAudioFormats(): string[] {
  return [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg',
    'audio/webm',
    'audio/flac'
  ];
}

/**
 * Validate if an audio file format is supported
 * @param file - File to validate
 * @returns boolean - Whether the file format is supported
 */
export function isValidAudioFile(file: File): boolean {
  const supportedFormats = getSupportedAudioFormats();
  return supportedFormats.some(format => 
    file.type === format || 
    file.type.startsWith(format.split('/')[0] + '/')
  );
}