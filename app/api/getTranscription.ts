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
 * with automatic language detection for Indian languages
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
 * Filters results to only support Indian languages
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

    const detectedLanguage = result.language || 'unknown';
    
    // Check if detected language is an Indian language
    if (!isIndianLanguage(detectedLanguage)) {
      throw new Error(`Unsupported language detected: ${getLanguageName(detectedLanguage)}. Only Indian languages are supported.`);
    }

    return {
      success: true,
      text: result.text.trim(),
      language: detectedLanguage
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transcription failed'
    };
  }
}

/**
 * Check if a language code represents an Indian language
 * @param languageCode - ISO language code
 * @returns boolean - Whether the language is an Indian language
 */
function isIndianLanguage(languageCode: string): boolean {
  const indianLanguages = [
    'hi', // Hindi
    'bn', // Bengali
    'te', // Telugu
    'mr', // Marathi
    'ta', // Tamil
    'gu', // Gujarati
    'kn', // Kannada
    'ml', // Malayalam
    'or', // Odia
    'pa', // Punjabi
    'as', // Assamese
    'mai', // Maithili
    'mag', // Magahi
    'bho', // Bhojpuri
    'ne', // Nepali
    'sa', // Sanskrit
    'ks', // Kashmiri
    'sd', // Sindhi
    'kok', // Konkani
    'mni', // Manipuri
    'sat', // Santali
    'doi', // Dogri
    'brx', // Bodo
    'en' // English (widely used in India)
  ];
  
  return indianLanguages.includes(languageCode);
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
 * Focused on Indian languages
 * @param languageCode - ISO language code (e.g., 'hi', 'bn', 'te')
 * @returns string - Human-readable language name
 */
export function getLanguageName(languageCode: string): string {
  const indianLanguageNames: { [key: string]: string } = {
    'hi': 'Hindi (हिन्दी)',
    'bn': 'Bengali (বাংলা)',
    'te': 'Telugu (తెలుగు)',
    'mr': 'Marathi (मराठी)',
    'ta': 'Tamil (தமிழ்)',
    'gu': 'Gujarati (ગુજરાતી)',
    'kn': 'Kannada (ಕನ್ನಡ)',
    'ml': 'Malayalam (മലയാളം)',
    'or': 'Odia (ଓଡ଼ିଆ)',
    'pa': 'Punjabi (ਪੰਜਾਬੀ)',
    'as': 'Assamese (অসমীয়া)',
    'mai': 'Maithili (मैथिली)',
    'mag': 'Magahi (𑂧𑂏𑂯𑂲)',
    'bho': 'Bhojpuri (भोजपुरी)',
    'ne': 'Nepali (नेपाली)',
    'sa': 'Sanskrit (संस्कृतम्)',
    'ks': 'Kashmiri (कॉशुर)',
    'sd': 'Sindhi (سنڌي)',
    'kok': 'Konkani (कोंकणी)',
    'mni': 'Manipuri (মণিপুরী)',
    'sat': 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)',
    'doi': 'Dogri (डोगरी)',
    'brx': 'Bodo (बड़ो)',
    'en': 'English',
    'unknown': 'Unknown Language'
  };

  return indianLanguageNames[languageCode] || `${languageCode.toUpperCase()} (Unsupported)`;
}

/**
 * Get list of all supported Indian languages
 * @returns Array of objects with language code and name
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  const supportedCodes = [
    'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'or', 'pa', 
    'as', 'mai', 'mag', 'bho', 'ne', 'sa', 'ks', 'sd', 'kok', 
    'mni', 'sat', 'doi', 'brx', 'en'
  ];
  
  return supportedCodes.map(code => ({
    code,
    name: getLanguageName(code)
  }));
}