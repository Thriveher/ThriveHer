// voiceTranscriptionAPI.ts

// Hardcoded API key (replace with your actual Groq API key)
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  language?: string; // Detected language code
  error?: string;
}

export interface VoiceRecordingOptions {
  maxDuration?: number; // in milliseconds, default 30000 (30 seconds)
  mimeType?: string; // default 'audio/webm'
}

/**
 * Records audio from user's microphone and transcribes it using Groq's Whisper API
 * with automatic language detection for Indian languages and English
 * @param options - Optional configuration for recording
 * @returns Promise<TranscriptionResult> - The transcribed text, detected language, or error
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
 * Transcribe an audio blob using Groq's Whisper API with automatic language detection
 * @param audioBlob - The audio data to transcribe
 * @returns Promise<TranscriptionResult> - The transcribed text, detected language, or error
 */
async function transcribeAudioBlob(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    // Prepare form data for the API request
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3-turbo');
    // Remove language parameter to enable auto-detection
    formData.append('response_format', 'verbose_json'); // Use verbose_json to get language info

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
      text: result.text.trim(),
      language: result.language || 'unknown' // Get detected language from verbose response
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
 * @returns Promise<TranscriptionResult> - The transcribed text, detected language, or error
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

/**
 * Get human-readable language name from language code
 * Supports Indian languages and English only
 * @param languageCode - ISO language code (e.g., 'en', 'hi', 'ta')
 * @returns string - Human-readable language name
 */
export function getLanguageName(languageCode: string): string {
  const indianLanguageNames: { [key: string]: string } = {
    // English
    'en': 'English',
    
    // Major Indian Languages (22 official languages)
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
    'my': 'Myanmar', // မြန်မာ
    'ks': 'Kashmiri', // कॉशुर
    'sd': 'Sindhi', // سنڌي
    'sa': 'Sanskrit', // संस्कृत
    'mai': 'Maithili', // मैथिली
    'doi': 'Dogri', // डोगरी
    'sat': 'Santali', // ᱥᱟᱱᱛᱟᱲᱤ
    'kok': 'Konkani', // कोंकणी
    'mni': 'Manipuri', // মৈতৈলোন্
    'brx': 'Bodo', // बड़ो
    
    // Regional variations and common codes
    'hi-in': 'Hindi (India)',
    'en-in': 'Indian English',
    'ta-in': 'Tamil (India)',
    'te-in': 'Telugu (India)',
    'bn-in': 'Bengali (India)',
    'gu-in': 'Gujarati (India)',
    'kn-in': 'Kannada (India)',
    'ml-in': 'Malayalam (India)',
    'mr-in': 'Marathi (India)',
    'or-in': 'Odia (India)',
    'pa-in': 'Punjabi (India)',
    'as-in': 'Assamese (India)',
    
    'unknown': 'Unknown Language'
  };

  return indianLanguageNames[languageCode] || indianLanguageNames[languageCode.toLowerCase()] || languageCode.toUpperCase();
}

/**
 * Check if a detected language is supported (Indian languages + English)
 * @param languageCode - ISO language code
 * @returns boolean - Whether the language is supported
 */
export function isSupportedLanguage(languageCode: string): boolean {
  const supportedLanguages = [
    'en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'or', 'pa', 'as', 
    'ne', 'si', 'my', 'ks', 'sd', 'sa', 'mai', 'doi', 'sat', 'kok', 'mni', 'brx',
    'hi-in', 'en-in', 'ta-in', 'te-in', 'bn-in', 'gu-in', 'kn-in', 'ml-in', 
    'mr-in', 'or-in', 'pa-in', 'as-in'
  ];
  
  return supportedLanguages.includes(languageCode.toLowerCase());
}

/**
 * Get list of all supported languages
 * @returns Array of language objects with code and name
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'or', name: 'Odia' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'as', name: 'Assamese' },
    { code: 'ne', name: 'Nepali' },
    { code: 'si', name: 'Sinhala' },
    { code: 'ks', name: 'Kashmiri' },
    { code: 'sd', name: 'Sindhi' },
    { code: 'sa', name: 'Sanskrit' },
    { code: 'mai', name: 'Maithili' },
    { code: 'doi', name: 'Dogri' },
    { code: 'sat', name: 'Santali' },
    { code: 'kok', name: 'Konkani' },
    { code: 'mni', name: 'Manipuri' },
    { code: 'brx', name: 'Bodo' }
  ];
}