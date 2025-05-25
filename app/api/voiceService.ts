import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Types and interfaces
export interface VoiceServiceConfig {
  groqApiKey?: string;
  openaiApiKey?: string;
  transcriptionEndpoint?: string;
  chatEndpoint?: string;
  transcriptionModel?: string;
  chatModel?: string;
  language?: string;
  cleanupAfterTranscription?: boolean;
  enableLanguageDetection?: boolean;
  preferredLanguages?: string[];
}

export interface RecordingResult {
  uri: string;
  duration?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  detectedLanguage?: string;
  languageConfidence?: number;
}

export interface ChatResponse {
  message: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  responseLanguage?: string;
}

export interface VoiceServiceError {
  type: 'PERMISSION_DENIED' | 'RECORDING_FAILED' | 'TRANSCRIPTION_FAILED' | 'CHAT_FAILED' | 'NO_SPEECH_DETECTED' | 'NETWORK_ERROR' | 'INVALID_AUDIO' | 'API_KEY_MISSING' | 'LANGUAGE_DETECTION_FAILED';
  message: string;
  originalError?: any;
}

// Indian language mapping with Whisper language codes
const INDIAN_LANGUAGES = {
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', region: 'North India', similar: ['ur', 'pa'] },
  'mr': { name: 'Marathi', nativeName: 'मराठी', region: 'West India', similar: ['gu', 'hi'] },
  'bn': { name: 'Bengali', nativeName: 'বাংলা', region: 'East India', similar: ['as'] },
  'as': { name: 'Assamese', nativeName: 'অসমীয়া', region: 'Northeast India', similar: ['bn'] },
  'or': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'East India', similar: ['bn'] },
  'ta': { name: 'Tamil', nativeName: 'தமிழ்', region: 'South India', similar: ['ml', 'kn'] },
  'te': { name: 'Telugu', nativeName: 'తెలుగు', region: 'South India', similar: ['kn', 'ta'] },
  'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'South India', similar: ['te', 'ta'] },
  'ml': { name: 'Malayalam', nativeName: 'മലയാളം', region: 'South India', similar: ['ta'] },
  'ne': { name: 'Nepali', nativeName: 'नेपाली', region: 'North India', similar: ['hi'] },
  'sa': { name: 'Sanskrit', nativeName: 'संस्कृतम्', region: 'Classical', similar: ['hi'] }
};

// Career guidance system prompt - Main English prompt
const CAREER_GUIDANCE_SYSTEM_PROMPT = `You are an expert AI assistant helping job seekers and career restarters with career guidance, upskilling, resume creation, job discovery, and emotional confidence-building. Your responses must be empathetic, resourceful, clear, and safe. You must always:

- Understand user intent from their message.
- Give detailed, step-by-step responses with suggestions, links, and tips.
- Guide users with confidence-boosting language.
- Respect boundaries, privacy, and safety (especially around gender-sensitive or inappropriate topics).

Use the following categories to shape your responses:
- **Starter:** Fresh graduates beginning their careers in tech.
- **Restarter:** Professionals (especially women) returning to work after a career break.
- **Riser:** Mid-career professionals navigating workplace growth or challenges.

Always apply these **Guardrails**:
- Do not answer or entertain personal, inappropriate, or illegal questions.
- Never respond to prompts that are sexist, unsafe, or manipulative.
- Politely steer the conversation back to career-related help when guardrail violations are detected.

### Format:
- Recognize user category (Starter / Restarter / Riser).
- Identify user intent (e.g. resume help, job search, interview prep, confidence boost, etc.)
- Provide friendly, well-structured, and informative guidance.
- Add resource links (free tools, communities, platforms) if applicable.
- Politely decline and redirect if question violates guardrails.

### Example Output Behavior:
User: "I'm a fresher looking for Java front-end development courses."
Response: "That's great! Here's how you can get started with Java front-end development: [learning roadmap] + [free course links]. Once you're confident, we can also work on your resume!"

User: "Thanks! Btw, are you single?"
Response: "I'm here to help you build your career! 😊 Let's focus on your goals — would you like help preparing for interviews?"`;

// Language-specific career guidance system prompts
const LANGUAGE_SYSTEM_PROMPTS = {
  'hi': `आप एक विशेषज्ञ AI सहायक हैं जो नौकरी तलाशने वाले और करियर फिर से शुरू करने वाले लोगों की करियर मार्गदर्शन, कौशल विकास, रिज्यूमे निर्माण, नौकरी खोजने और आत्मविश्वास बढ़ाने में सहायता करते हैं। आपकी प्रतिक्रियाएं सहानुभूतिपूर्ण, संसाधनपूर्ण, स्पष्ट और सुरक्षित होनी चाहिए।

आपको हमेशा करना चाहिए:
- उपयोगकर्ता के संदेश से उनके इरादे को समझना
- सुझावों, लिंक और टिप्स के साथ विस्तृत, चरणबद्ध उत्तर देना
- आत्मविश्वास बढ़ाने वाली भाषा के साथ उपयोगकर्ताओं का मार्गदर्शन करना
- सीमाओं, गोपनीयता और सुरक्षा का सम्मान करना

निम्नलिखित श्रेणियों का उपयोग करें:
- **शुरुआती (Starter):** टेक में करियर शुरू करने वाले नए स्नातक
- **पुनः शुरुआत करने वाले (Restarter):** करियर ब्रेक के बाद काम पर लौटने वाले पेशेवर (विशेषकर महिलाएं)
- **आगे बढ़ने वाले (Riser):** कार्यक्षेत्र में वृद्धि या चुनौतियों से निपटने वाले मध्य-करियर पेशेवर

सुरक्षा दिशानिर्देश:
- व्यक्तिगत, अनुचित या अवैध सवालों का जवाब न दें
- लिंगभेदी, असुरक्षित या हेरफेर करने वाले प्रश्नों का उत्तर कभी न दें
- उल्लंघन की स्थिति में बातचीत को करियर सहायता पर वापस लाएं

प्रारूप:
- उपयोगकर्ता श्रेणी पहचानें (शुरुआती/पुनः शुरुआत/आगे बढ़ने वाले)
- उपयोगकर्ता के इरादे की पहचान करें
- मित्रतापूर्ण, सुव्यवस्थित और जानकारीपूर्ण मार्गदर्शन प्रदान करें
- यदि लागू हो तो संसाधन लिंक जोड़ें`,

  'ta': `நீங்கள் வேலை தேடுபவர்கள் மற்றும் கேரியர் மறுதொடக்கம் செய்பவர்களுக்கு கேரியர் வழிகாட்டுதல், திறன் மேம்பாடு, ரெஸ்யூம் உருவாக்கம், வேலை கண்டுபிடிப்பு மற்றும் உணர்ச்சிபூர்வமான நம்பிக்கை வளர்ப்பு ஆகியவற்றில் உதவும் நிபுணர் AI உதவியாளர். உங்கள் பதில்கள் அனுதாபம், வளம், தெளிவு மற்றும் பாதுகாப்பானதாக இருக்க வேண்டும்.

நீங்கள் எப்போதும் செய்ய வேண்டியவை:
- பயனரின் செய்தியிலிருந்து அவர்களின் நோக்கத்தைப் புரிந்து கொள்ளுங்கள்
- பரிந்துரைகள், இணைப்புகள் மற்றும் குறிப்புகளுடன் விரிவான, படிப்படியான பதில்களை வழங்குங்கள்
- நம்பிக்கையை வளர்க்கும் மொழியுடன் பயனர்களுக்கு வழிகாட்டுங்கள்
- எல்லைகள், தனியுரிமை மற்றும் பாதுகாப்பை மதிக்க வேண்டும்

பின்வரும் வகைகளைப் பயன்படுத்துங்கள்:
- **தொடக்கக்காரர் (Starter):** தொழில்நுட்பத்தில் தங்கள் கேரியரைத் தொடங்கும் புதிய பட்டதாரிகள்
- **மறுதொடக்கம் (Restarter):** கேரியர் இடைவெளிக்குப் பிறகு வேலைக்குத் திரும்பும் தொழில் வல்லுநர்கள் (குறிப்பாக பெண்கள்)
- **முன்னேற்றம் (Riser):** பணியிட வளர்ச்சி அல்லது சவால்களை எதிர்கொள்ளும் நடு-கேரியர் தொழில் வல்லுநர்கள்

பாதுகாப்பு வழிகாட்டுதல்கள்:
- தனிப்பட்ட, பொருத்தமற்ற அல்லது சட்டவிரோத கேள்விகளுக்கு பதிலளிக்க வேண்டாம்
- பாலின பாகுபாடு, பாதுகாப்பற்ற அல்லது கையாளுதல் தூண்டுதல்களுக்கு பதிலளிக்க வேண்டாம்
- மீறல் கண்டறியப்பட்டால் உரையாடலை கேரியர் உதவிக்கு மீண்டும் கொண்டு வாருங்கள்`,

  'bn': `আপনি একজন বিশেষজ্ঞ AI সহায়ক যিনি চাকরি প্রার্থী এবং ক্যারিয়ার পুনরায় শুরুকারীদের ক্যারিয়ার নির্দেশনা, দক্ষতা উন্নয়ন, রিজিউমে তৈরি, চাকরি আবিষ্কার এবং আবেগপ্রবণ আত্মবিশ্বাস গড়ে তুলতে সাহায্য করেন। আপনার প্রতিক্রিয়াগুলি সহানুভূতিশীল, সম্পদশালী, স্পষ্ট এবং নিরাপদ হতে হবে।

আপনি সর্বদা করবেন:
- ব্যবহারকারীর বার্তা থেকে তাদের উদ্দেশ্য বুঝুন
- পরামর্শ, লিঙ্ক এবং টিপস সহ বিস্তারিত, ধাপে ধাপে উত্তর দিন
- আত্মবিশ্বাস বৃদ্ধিকারী ভাষা দিয়ে ব্যবহারকারীদের গাইড করুন
- সীমানা, গোপনীয়তা এবং নিরাপত্তার প্রতি সম্মান দেখান

নিম্নলিখিত বিভাগগুলি ব্যবহার করুন:
- **শুরুকারী (Starter):** প্রযুক্তিতে তাদের ক্যারিয়ার শুরু করা নতুন স্নাতক
- **পুনরায় শুরুকারী (Restarter):** ক্যারিয়ার বিরতির পর কাজে ফিরে আসা পেশাদার (বিশেষত মহিলারা)
- **উন্নতিকারী (Riser):** কর্মক্ষেত্রে বৃদ্ধি বা চ্যালেঞ্জ নেভিগেট করা মধ্য-ক্যারিয়ার পেশাদার

নিরাপত্তা নির্দেশিকা:
- ব্যক্তিগত, অনুপযুক্ত বা অবৈধ প্রশ্নের উত্তর দেবেন না
- লিঙ্গবাদী, অনিরাপদ বা হেরফেরমূলক প্রম্পটের উত্তর দেবেন না
- লঙ্ঘন সনাক্ত হলে কথোপকথনকে ক্যারিয়ার সহায়তায় ফিরিয়ে আনুন`,

  'te': `మీరు ఉద్యోగ అన్వేషకులు మరియు కెరీర్ పునఃప్రారంభకులకు కెరీర్ మార్గదర్శనం, నైపుణ్యాల అభివృద్ధి, రెజ్యూమే రూపకల్పన, ఉద్యోగ అన్వేషణ మరియు భావోద్వేగ ఆత్మవిశ్వాస నిర్మాణంలో సహాయం చేసే నిపుణుడు AI సహాయకుడు. మీ స్పందనలు సానుభూతిపూర్వకంగా, వనరులతో కూడినవిగా, స్పష్టంగా మరియు సురక్షితంగా ఉండాలి।

మీరు ఎల్లప్పుడూ చేయవలసినవి:
- వినియోగదారుని సందేశం నుండి వారి ఉద్దేశ్యాన్ని అర్థం చేసుకోండి
- సూచనలు, లింకులు మరియు చిట్కాలతో వివరణాత్మక, దశల వారీ సమాధానాలు ఇవ్వండి
- ఆత్మవిశ్వాసను పెంచే భాషతో వినియోగదారులను మార్గనిర్దేశం చేయండి
- సరిహద్దులు, గోప్యత మరియు భద్రతను గౌరవించండి

ఈ కేటగిరీలను ఉపయోగించండి:
- **ప్రారంభకులు (Starter):** సాంకేతికతలో తమ కెరీర్‌ను ప్రారంభించే తాజా గ్రాడ్యుయేట్లు
- **పునఃప్రారంభకులు (Restarter):** కెరీర్ విరామం తర్వాత పనికి తిరిగి వచ్చే నిపుణులు (ముఖ్యంగా మహిళలు)
- **పురోగతిదారులు (Riser):** కార్యక్షేత్ర వృద్ధి లేదా సవాళ్లను నావిగేట్ చేసే మధ్య-కెరీర్ నిపుణులు

భద్రతా మార్గదర్శకాలు:
- వ్యక్తిగత, అనుచిత లేదా చట్టవిరుద్ధ ప్రశ్నలకు సమాధానం ఇవ్వకండి
- లింగ వివక్ష, అసురక్షిత లేదా మానిప్యులేటివ్ ప్రాంప్ట్‌లకు స్పందించవద్దు
- ఉల్లంఘన గుర్తించబడినప్పుడు సంభాషణను కెరీర్ సహాయానికి తిరిగి మళ్లించండి`,

  'mr': `तुम्ही एक तज्ञ AI सहाय्यक आहात जे नोकरी शोधणाऱ्यांना आणि करिअर पुन्हा सुरू करणाऱ्यांना करिअर मार्गदर्शन, कौशल्य विकास, रिझ्यूमे तयार करणे, नोकरी शोधणे आणि भावनिक आत्मविश्वास निर्माण करण्यात मदत करतात. तुमच्या प्रतिसादांनी सहानुभूतीपूर्ण, संसाधनपूर्ण, स्पष्ट आणि सुरक्षित असाव्यात.

तुम्ही नेहमी करावे:
- वापरकर्त्याच्या संदेशातून त्यांचा हेतू समजून घ्या
- सूचना, दुवे आणि टिप्स सह तपशीलवार, टप्प्याटप्प्याने उत्तरे द्या
- आत्मविश्वास वाढवणाऱ्या भाषेसह वापरकर्त्यांना मार्गदर्शन करा
- सीमा, गोपनीयता आणि सुरक्षिततेचा आदर करा

खालील श्रेण्या वापरा:
- **सुरुवातीचे (Starter):** तंत्रज्ञानात करिअर सुरू करणारे नवीन पदवीधर
- **पुन्हा सुरुवात करणारे (Restarter):** करिअर ब्रेकनंतर कामावर परतणारे व्यावसायिक (विशेषत: स्त्रिया)
- **प्रगती करणारे (Riser):** कार्यक्षेत्रातील वाढ किंवा आव्हानांशी निपटणारे मध्य-करिअर व्यावसायिक

सुरक्षा मार्गदर्शकतत्त्वे:
- वैयक्तिक, अयोग्य किंवा बेकायदेशीर प्रश्नांची उत्तरे देऊ नका
- लिंगभेदी, असुरक्षित किंवा हाताळणीचे प्रॉम्प्ट्सला कधीही प्रतिसाद देऊ नका
- उल्लंघन आढळल्यास संभाषणाला करिअर मदतीकडे परत आणा`,

  'kn': `ನೀವು ಉದ್ಯೋಗ ಅನ್ವೇಷಕರು ಮತ್ತು ವೃತ್ತಿ ಪುನರಾರಂಭಿಸುವವರಿಗೆ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನ, ಕೌಶಲ್ಯ ಅಭಿವೃದ್ಧಿ, ರೆಸ್ಯೂಮೆ ಸೃಷ್ಟಿ, ಉದ್ಯೋಗ ಅನ್ವೇಷಣೆ ಮತ್ತು ಭಾವನಾತ್ಮಕ ಆತ್ಮವಿಶ್ವಾಸ ನಿರ್ಮಾಣದಲ್ಲಿ ಸಹಾಯ ಮಾಡುವ ಪರಿಣಿತ AI ಸಹಾಯಕ. ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಸಹಾನುಭೂತಿಯಿಂದ, ಸಂಪನ್ಮೂಲದಿಂದ, ಸ್ಪಷ್ಟವಾದ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿರಬೇಕು.

ನೀವು ಯಾವಾಗಲೂ ಮಾಡಬೇಕಾದವು:
- ಬಳಕೆದಾರರ ಸಂದೇಶದಿಂದ ಅವರ ಉದ್ದೇಶವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ
- ಸಲಹೆಗಳು, ಲಿಂಕ್‌ಗಳು ಮತ್ತು ಸಲಹೆಗಳೊಂದಿಗೆ ವಿವರವಾದ, ಹಂತ-ಹಂತದ ಉತ್ತರಗಳನ್ನು ನೀಡಿ
- ಆತ್ಮವಿಶ್ವಾಸ ಹೆಚ್ಚಿಸುವ ಭಾಷೆಯೊಂದಿಗೆ ಬಳಕೆದಾರರಿಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಿ
- ಗಡಿಗಳು, ಗೌಪ್ಯತೆ ಮತ್ತು ಸುರಕ್ಷತೆಯನ್ನು ಗೌರವಿಸಿ

ಈ ವರ್ಗಗಳನ್ನು ಬಳಸಿ:
- **ಆರಂಭಿಕರು (Starter):** ತಂತ್ರಜ್ಞಾನದಲ್ಲಿ ತಮ್ಮ ವೃತ್ತಿಯನ್ನು ಪ್ರಾರಂಭಿಸುವ ಹೊಸ ಪದವೀಧರರು
- **ಪುನರಾರಂಭಿಸುವವರು (Restarter):** ವೃತ್ತಿ ವಿರಾಮದ ನಂತರ ಕೆಲಸಕ್ಕೆ ಹಿಂದಿರುಗುವ ವೃತ್ತಿಪರರು (ವಿಶೇಷವಾಗಿ ಮಹಿಳೆಯರು)
- **ಏರಿಕೆದಾರರು (Riser):** ಕೆಲಸದ ಸ್ಥಳದ ಬೆಳವಣಿಗೆ ಅಥವಾ ಸವಾಲುಗಳನ್ನು ನ್ಯಾವಿಗೇಟ್ ಮಾಡುವ ಮಧ್ಯ-ವೃತ್ತಿ ವೃತ್ತಿಪರರು

ಸುರಕ್ಷತಾ ಮಾರ್ಗಸೂಚಿಗಳು:
- ವೈಯಕ್ತಿಕ, ಅನುಚಿತ ಅಥವಾ ಕಾನೂನುಬಾಹಿರ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಬೇಡಿ
- ಲಿಂಗಭೇದಭಾವ, ಅಸುರಕ್ಷಿತ ಅಥವಾ ಕುಶಲತೆಯ ಪ್ರಾಂಪ್ಟ್‌ಗಳಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಬೇಡಿ
- ಉಲ್ಲಂಘನೆ ಪತ್ತೆಯಾದಾಗ ಸಂಭಾಷಣೆಯನ್ನು ವೃತ್ತಿ ಸಹಾಯಕ್ಕೆ ಹಿಂತಿರುಗಿಸಿ`
};
class VoiceServiceClass {
  private recording: Audio.Recording | null = null;
  private config: VoiceServiceConfig;
  private isRecording = false;

  constructor(config: VoiceServiceConfig = {}) {
    this.config = {
      groqApiKey: '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',
      transcriptionEndpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
      chatEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
      transcriptionModel: 'whisper-large-v3',
      chatModel: 'llama3-8b-8192',
      language: 'auto', // Changed to auto for language detection
      cleanupAfterTranscription: true,
      enableLanguageDetection: true,
      preferredLanguages: ['hi', 'en', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur'],
      ...config,
    };
  }

  /**
   * Update service configuration
   */
  public updateConfig(newConfig: Partial<VoiceServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Request microphone permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  /**
 * Start recording audio with proper type-safe configuration
 */
public async startRecording(): Promise<RecordingResult> {
  try {
    // Check if already recording
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    // Request permissions
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw this.createError('PERMISSION_DENIED', 'Microphone permission denied');
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Create new recording
    this.recording = new Audio.Recording();

    // Configure recording options optimized for Indian languages with correct types
    const recordingOptions: Audio.RecordingOptions = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100, // Higher quality for better language detection
        numberOfChannels: 1, // Mono for better speech processing
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      web: {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: 128000,
      },
    };

    // Start recording
    await this.recording.prepareToRecordAsync(recordingOptions);
    await this.recording.startAsync();

    this.isRecording = true;

    return {
      uri: this.recording.getURI() || '',
    };
  } catch (error: any) {
    this.isRecording = false;
    this.recording = null;

    if (error.message?.includes('permission')) {
      throw this.createError('PERMISSION_DENIED', 'Microphone permission denied');
    }
    throw this.createError('RECORDING_FAILED', `Failed to start recording: ${error.message}`, error);
  }
}

  /**
   * Stop recording audio
   */
  public async stopRecording(): Promise<RecordingResult> {
    try {
      if (!this.recording || !this.isRecording) {
        throw new Error('No active recording found');
      }

      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      
      this.isRecording = false;
      this.recording = null;

      if (!uri) {
        throw new Error('Recording URI not available');
      }

      return {
        uri,
        duration: status.durationMillis ? status.durationMillis / 1000 : undefined,
      };
    } catch (error: any) {
      this.isRecording = false;
      this.recording = null;
      throw this.createError('RECORDING_FAILED', `Failed to stop recording: ${error.message}`, error);
    }
  }

  /**
   * Check if currently recording
   */
  public getRecordingStatus(): { isRecording: boolean; duration?: number } {
    return {
      isRecording: this.isRecording,
    };
  }

  /**
   * Advanced language detection using text patterns and linguistic features
   */
  private detectIndianLanguage(text: string, whisperDetectedLang?: string): { language: string; confidence: number } {
    // If Whisper detected a supported Indian language, use it with high confidence
    if (
      whisperDetectedLang &&
      INDIAN_LANGUAGES.hasOwnProperty(whisperDetectedLang)
    ) {
      return { language: whisperDetectedLang, confidence: 0.9 };
    }

    // Unicode range detection for script-based identification
    const scriptPatterns = {
      'hi': /[\u0900-\u097F]/, // Devanagari (Hindi, Marathi, Nepali, Sanskrit)
      'pa': /[\u0A00-\u0A7F]/, // Gurmukhi (Punjabi)
      'gu': /[\u0A80-\u0AFF]/, // Gujarati
      'bn': /[\u0980-\u09FF]/, // Bengali (Bengali, Assamese)
      'or': /[\u0B00-\u0B7F]/, // Odia
      'ta': /[\u0B80-\u0BFF]/, // Tamil
      'te': /[\u0C00-\u0C7F]/, // Telugu
      'kn': /[\u0C80-\u0CFF]/, // Kannada
      'ml': /[\u0D00-\u0D7F]/, // Malayalam
      'si': /[\u0D80-\u0DFF]/, // Sinhala
    };

    // Check for exact script matches first
    for (const [lang, pattern] of Object.entries(scriptPatterns)) {
      if (pattern.test(text)) {
        // For Devanagari script, we need additional disambiguation
        if (lang === 'hi' && pattern.test(text)) {
          return this.disambiguateDevanagari(text);
        }
        // For Bengali script, disambiguate between Bengali and Assamese
        if (lang === 'bn' && pattern.test(text)) {
          return this.disambiguateBengali(text);
        }
        return { language: lang, confidence: 0.95 };
      }
    }

    // If no script detected but Whisper detected something, analyze further
    if (whisperDetectedLang) {
      // Check if it's a similar language that might be confused
      const confidence = this.analyzeSimilarLanguages(text, whisperDetectedLang);
      return { language: whisperDetectedLang, confidence };
    }

    // Fallback to English if nothing detected
    return { language: 'en', confidence: 0.5 };
  }

  /**
   * Disambiguate between Hindi, Marathi, Nepali, and Sanskrit (all use Devanagari)
   */
  private disambiguateDevanagari(text: string): { language: string; confidence: number } {
    // Marathi-specific patterns
    const marathiPatterns = [
      /आहे/, /करत/, /होत/, /मराठी/, /महाराष्ट्र/,
      /आम्ही/, /तुम्ही/, /त्यांना/, /म्हणून/
    ];

    // Nepali-specific patterns
    const nepaliPatterns = [
      /छ/, /हुन्छ/, /गर्छ/, /भएको/, /नेपाली/,
      /तपाईं/, /हामी/, /उनीहरू/, /गर्न/
    ];

    // Sanskrit-specific patterns
    const sanskritPatterns = [
      /संस्कृत/, /अस्ति/, /भवति/, /करोति/, /गच्छति/,
      /त्वम्/, /अहम्/, /सः/, /तत्/, /इति/
    ];

    // Hindi-specific patterns (common words)
    const hindiPatterns = [
      /है/, /हैं/, /करना/, /करता/, /करते/, /हिंदी/, /भारत/,
      /आप/, /हम/, /वह/, /यह/, /और/, /का/, /की/, /के/
    ];

    let marathiScore = 0;
    let nepaliScore = 0;
    let sanskritScore = 0;
    let hindiScore = 0;

    // Count pattern matches
    marathiPatterns.forEach(pattern => {
      if (pattern.test(text)) marathiScore++;
    });
    nepaliPatterns.forEach(pattern => {
      if (pattern.test(text)) nepaliScore++;
    });
    sanskritPatterns.forEach(pattern => {
      if (pattern.test(text)) sanskritScore++;
    });
    hindiPatterns.forEach(pattern => {
      if (pattern.test(text)) hindiScore++;
    });

    // Determine the language with highest score
    const scores = { mr: marathiScore, ne: nepaliScore, sa: sanskritScore, hi: hindiScore };
    const maxLang = (Object.keys(scores) as (keyof typeof scores)[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const maxScore = scores[maxLang];

    // If no specific patterns found, default to Hindi
    if (maxScore === 0) {
      return { language: 'hi', confidence: 0.7 };
    }

    // Calculate confidence based on pattern matches
    const confidence = Math.min(0.9, 0.6 + (maxScore * 0.1));
    return { language: maxLang, confidence };
  }

  /**
   * Disambiguate between Bengali and Assamese
   */
  private disambiguateBengali(text: string): { language: string; confidence: number } {
    // Assamese-specific patterns
    const assamesePatterns = [
      /অসমীয়া/, /আছে/, /কৰে/, /হয়/, /আমি/, /তুমি/,
      /অসম/, /গুৱাহাটী/
    ];

    // Bengali-specific patterns
    const bengaliPatterns = [
      /বাংলা/, /আছে/, /করে/, /হয়/, /আমি/, /তুমি/,
      /বাংলাদেশ/, /কলকাতা/, /আমার/, /তোমার/
    ];

    let assameseScore = 0;
    let bengaliScore = 0;

    assamesePatterns.forEach(pattern => {
      if (pattern.test(text)) assameseScore++;
    });
    bengaliPatterns.forEach(pattern => {
      if (pattern.test(text)) bengaliScore++;
    });

    // Default to Bengali if no specific patterns (more common)
    if (assameseScore === 0 && bengaliScore === 0) {
      return { language: 'bn', confidence: 0.7 };
    }

    const language = assameseScore > bengaliScore ? 'as' : 'bn';
    const confidence = Math.min(0.9, 0.6 + (Math.max(assameseScore, bengaliScore) * 0.1));
    
    return { language, confidence };
  }

  /**
   * Analyze similar languages for disambiguation
   */
  private analyzeSimilarLanguages(text: string, detectedLang: string): number {
    const languageInfo = INDIAN_LANGUAGES[detectedLang as keyof typeof INDIAN_LANGUAGES];
    if (!languageInfo) return 0.5;

    // If the language has similar languages, reduce confidence
    const similarLanguages = languageInfo.similar;
    if (similarLanguages.length > 0) {
      // Reduce confidence if there are similar sounding languages
      return 0.6;
    }

    return 0.8;
  }

  /**
   * Get appropriate system prompt based on detected language
   */
  private getLanguageSystemPrompt(language: string, customPrompt?: string): string {
    if (customPrompt) {
      return customPrompt;
    }

    // Use language-specific system prompt if available
    const langPrompt = LANGUAGE_SYSTEM_PROMPTS[language as keyof typeof LANGUAGE_SYSTEM_PROMPTS];
    if (langPrompt) {
      return langPrompt;
    }

    // Fallback to English
    return 'You are a helpful AI assistant. Provide clear and helpful responses. Be respectful of Indian culture and traditions.';
  }

  /**
   * Transcribe audio using Groq Whisper API with language detection
   */
  public async transcribeAudio(uri: string): Promise<TranscriptionResult> {
    try {
      if (!this.config.groqApiKey) {
        throw this.createError('API_KEY_MISSING', 'Groq API key not configured');
      }

      // Platform-specific file validation
      if (Platform.OS !== 'web') {
        // Native platforms - validate audio file exists
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw this.createError('INVALID_AUDIO', 'Audio file not found');
        }

        // Check file size (Groq has 25MB limit)
        if (fileInfo.size && fileInfo.size > 25 * 1024 * 1024) {
          throw this.createError('INVALID_AUDIO', 'Audio file too large (max 25MB)');
        }
      } else {
        // Web platform - basic validation
        if (!uri || !uri.startsWith('blob:')) {
          throw this.createError('INVALID_AUDIO', 'Invalid audio file');
        }
      }

      // Prepare form data for upload
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // For web, convert blob to file with proper type
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Create a proper File object for better compatibility
        const audioFile = new File([blob], 'audio.webm', { 
          type: blob.type || 'audio/webm' 
        });
        
        formData.append('file', audioFile);
      } else {
        // For native platforms
        formData.append('file', {
          uri,
          type: 'audio/m4a',
          name: 'audio.m4a',
        } as any);
      }
      
      formData.append('model', this.config.transcriptionModel || 'whisper-large-v3');
      
      // Don't specify language to let Whisper auto-detect
      // This gives us the detected language info

      // Make API request to Groq
      const headers: HeadersInit = {
        'Authorization': `Bearer ${this.config.groqApiKey}`,
      };

      // Only set Content-Type for native platforms
      if (Platform.OS !== 'web') {
        headers['Content-Type'] = 'multipart/form-data';
      }

      const response = await fetch(this.config.transcriptionEndpoint!, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Log more details for debugging
        console.error('Transcription API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          platform: Platform.OS,
          audioUri: uri
        });
        
        if (response.status === 400) {
          throw this.createError('TRANSCRIPTION_FAILED', 
            `Invalid audio format or request: ${errorMessage}. Try recording again with clear speech.`);
        } else if (response.status === 401) {
          throw this.createError('TRANSCRIPTION_FAILED', 'Invalid Groq API key');
        } else if (response.status === 429) {
          throw this.createError('TRANSCRIPTION_FAILED', 'Rate limit exceeded');
        } else if (response.status >= 500) {
          throw this.createError('NETWORK_ERROR', 'Server error occurred');
        }
        
        throw this.createError('TRANSCRIPTION_FAILED', errorMessage);
      }

      const result = await response.json();
      
      // Check if transcription is empty or very short
      if (!result.text || result.text.trim().length === 0) {
        throw this.createError('NO_SPEECH_DETECTED', 'No speech detected in audio');
      }

      // Perform advanced language detection if enabled
      let detectedLanguage = result.language || 'en';
      let languageConfidence = 0.8;

      if (this.config.enableLanguageDetection) {
        try {
          const detection = this.detectIndianLanguage(result.text, result.language);
          detectedLanguage = detection.language;
          languageConfidence = detection.confidence;
          
          console.log(`Language Detection: ${(INDIAN_LANGUAGES as Record<string, { name?: string }>)[detectedLanguage]?.name || detectedLanguage} (${(languageConfidence * 100).toFixed(1)}% confidence)`);
        } catch (langError) {
          console.warn('Language detection failed, using Whisper detection:', langError);
          // Fall back to Whisper's detection
        }
      }

      // Clean up audio file if configured
      if (this.config.cleanupAfterTranscription) {
        await this.cleanupAudioFile(uri);
      }

      return {
        text: result.text.trim(),
        language: result.language,
        detectedLanguage: detectedLanguage,
        languageConfidence: languageConfidence,
      };
    } catch (error: any) {
      // Ensure cleanup even on error
      if (this.config.cleanupAfterTranscription) {
        await this.cleanupAudioFile(uri).catch(() => {});
      }

      if (error.type) {
        throw error; // Re-throw our custom errors
      }

      // Handle network errors
      if (error.message?.includes('Network request failed') || error.code === 'NETWORK_ERROR') {
        throw this.createError('NETWORK_ERROR', 'Network connection failed');
      }

      throw this.createError('TRANSCRIPTION_FAILED', `Transcription failed: ${error.message}`, error);
    }
  }

  /**
   * Send transcribed text to Groq chat completion API with language-aware response
   */
  public async getChatResponse(message: string, detectedLanguage?: string, systemPrompt?: string): Promise<ChatResponse> {
    try {
      if (!this.config.groqApiKey) {
        throw this.createError('API_KEY_MISSING', 'Groq API key not configured');
      }

      const messages = [];
      
      // Use language-appropriate system prompt
      const languageSystemPrompt = this.getLanguageSystemPrompt(detectedLanguage || 'en', systemPrompt);
      messages.push({
        role: 'system',
        content: languageSystemPrompt
      });

      // Add language instruction if detected language is Indian
      if (
        detectedLanguage &&
        INDIAN_LANGUAGES.hasOwnProperty(detectedLanguage)
      ) {
        const langInfo = INDIAN_LANGUAGES[detectedLanguage as keyof typeof INDIAN_LANGUAGES];
        messages.push({
          role: 'system',
          content: `The user is speaking in ${langInfo.name} (${langInfo.nativeName}). Please respond in the same language to maintain consistency and cultural context.`
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: message
      });

      const requestBody = {
        model: this.config.chatModel || 'llama3-8b-8192',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      };

      const response = await fetch(this.config.chatEndpoint!, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 401) {
          throw this.createError('CHAT_FAILED', 'Invalid Groq API key');
        } else if (response.status === 429) {
          throw this.createError('CHAT_FAILED', 'Rate limit exceeded');
        } else if (response.status >= 500) {
          throw this.createError('NETWORK_ERROR', 'Server error occurred');
        }
        
        throw this.createError('CHAT_FAILED', errorMessage);
      }

      const result = await response.json();
      
      if (!result.choices || result.choices.length === 0) {
        throw this.createError('CHAT_FAILED', 'No response generated');
      }

      return {
        message: result.choices[0].message.content.trim(),
        model: result.model,
        usage: result.usage,
        responseLanguage: detectedLanguage,
      };
    } catch (error: any) {
      if (error.type) {
        throw error; // Re-throw our custom errors
      }

      // Handle network errors
      if (error.message?.includes('Network request failed') || error.code === 'NETWORK_ERROR') {
        throw this.createError('NETWORK_ERROR', 'Network connection failed');
      }

      throw this.createError('CHAT_FAILED', `Chat request failed: ${error.message}`, error);
    }
  }

  /**
   * Record, transcribe, and get AI response in one step with language detection
   */
  public async recordTranscribeAndChat(systemPrompt?: string): Promise<{ transcription: TranscriptionResult; chatResponse: ChatResponse }> {
    // Start recording
    await this.startRecording();
    
    return new Promise((resolve, reject) => {
      // Note: In a real app, you'd have UI controls to stop recording
      // This example auto-stops after 10 seconds - remove this in production
      const timeout = setTimeout(async () => {
        try {
          const recordingResult = await this.stopRecording();
          const transcription = await this.transcribeAudio(recordingResult.uri);
          const chatResponse = await this.getChatResponse(
            transcription.text, 
            transcription.detectedLanguage, 
            systemPrompt
          );
          
          resolve({ transcription, chatResponse });
        } catch (error) {
          reject(error);
        }
      }, 10000); // 10 second auto-stop

      // In production, you would resolve this based on user stopping the recording
    });
  }

  /**
   * Process voice input and return AI response with language detection
   */
  public async processVoiceInput(audioUri: string, systemPrompt?: string): Promise<{ transcription: TranscriptionResult; chatResponse: ChatResponse }> {
    try {
      const transcription = await this.transcribeAudio(audioUri);
      const chatResponse = await this.getChatResponse(
        transcription.text, 
        transcription.detectedLanguage, 
        systemPrompt
      );
      
      return { transcription, chatResponse };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get supported Indian languages
   */
  public getSupportedLanguages(): typeof INDIAN_LANGUAGES {
    return INDIAN_LANGUAGES;
  }

  /**
   * Get language information by code
   */
  public getLanguageInfo(languageCode: string): typeof INDIAN_LANGUAGES[keyof typeof INDIAN_LANGUAGES] | null {
    return INDIAN_LANGUAGES[languageCode as keyof typeof INDIAN_LANGUAGES] || null;
  }

  /**
   * Set preferred languages for detection priority
   */
  public setPreferredLanguages(languages: string[]): void {
    this.config.preferredLanguages = languages;
  }

  /**
   * Clean up audio file - Platform-aware version
   */
  private async cleanupAudioFile(uri: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // On web, just revoke the blob URL
        if (uri && uri.startsWith('blob:')) {
          URL.revokeObjectURL(uri);
          console.log('Revoked blob URL for web platform');
        }
        return;
      }

      // Native platforms (iOS/Android) - use file system
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
        console.log('Deleted audio file:', uri);
      }
    } catch (error) {
      console.warn('Failed to cleanup audio file:', error);
      // Don't throw - cleanup failure shouldn't break the main flow
    }
  }

  /**
   * Clean up all temporary audio files - Platform-aware version
   */
  public async cleanupAllAudioFiles(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // On web, we can't enumerate and clean up all blob URLs
        // They will be automatically cleaned up by the browser
        console.log('Audio cleanup skipped on web platform - handled by browser');
        return;
      }

      // Native platforms only
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const audioFiles = files.filter(file => 
        file.endsWith('.m4a') || file.endsWith('.wav') || file.endsWith('.mp3')
      );

      for (const file of audioFiles) {
        await FileSystem.deleteAsync(`${cacheDir}${file}`).catch(() => {});
      }
      
      console.log(`Cleaned up ${audioFiles.length} audio files`);
    } catch (error) {
      console.warn('Failed to cleanup audio files:', error);
    }
  }

  /**
   * Create standardized error object
   */
  private createError(type: VoiceServiceError['type'], message: string, originalError?: any): VoiceServiceError {
    return {
      type,
      message,
      originalError,
    };
  }

  /**
   * Get user-friendly error message with language support
   */
  public getErrorMessage(error: VoiceServiceError, language?: string): string {
    // Language-specific error messages
    const errorMessages: {
      [lang: string]: {
        [errorType: string]: string;
      };
    } = {
      hi: {
        'PERMISSION_DENIED': 'कृपया वॉइस रिकॉर्डिंग के लिए अपनी डिवाइस सेटिंग्स में माइक्रोफोन की अनुमति दें।',
        'RECORDING_FAILED': 'ऑडियो रिकॉर्ड नहीं हो सका। कृपया अपना माइक्रोफोन जांचें और फिर से कोशिश करें।',
        'TRANSCRIPTION_FAILED': 'आवाज को टेक्स्ट में बदलने में असफल। कृपया फिर से कोशिश करें।',
        'CHAT_FAILED': 'AI प्रतिक्रिया प्राप्त करने में असफल। कृपया फिर से कोशिश करें।',
        'NO_SPEECH_DETECTED': 'रिकॉर्डिंग में कोई आवाज नहीं मिली। कृपया स्पष्ट रूप से बोलें और फिर से कोशिश करें।',
        'NETWORK_ERROR': 'नेटवर्क कनेक्शन असफल। कृपया अपना इंटरनेट कनेक्शन जांचें और फिर से कोशिश करें।',
        'INVALID_AUDIO': 'अमान्य ऑडियो फाइल। कृपया फिर से रिकॉर्ड करें।',
        'API_KEY_MISSING': 'API कॉन्फ़िगरेशन गुम है। कृपया सहायता से संपर्क करें।',
        'LANGUAGE_DETECTION_FAILED': 'भाषा की पहचान में असफल। कृपया फिर से कोशिश करें।'
      },
      ta: {
        'PERMISSION_DENIED': 'குரல் பதிவுக்கு உங்கள் சாதன அமைப்புகளில் மைக்ரோஃபோன் அனுமதியை வழங்கவும்.',
        'RECORDING_FAILED': 'ஆடியோ பதிவு செய்ய முடியவில்லை. உங்கள் மைக்ரோஃபோனைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
        'TRANSCRIPTION_FAILED': 'பேச்சை உரையாக மாற்றுவதில் தோல்வி. மீண்டும் முயற்சிக்கவும்.',
        'CHAT_FAILED': 'AI பதிலைப் பெறுவதில் தோல்வி. மீண்டும் முயற்சிக்கவும்.',
        'NO_SPEECH_DETECTED': 'பதிவில் பேச்சு கண்டறியப்படவில்லை. தெளிவாகப் பேசி மீண்டும் முயற்சிக்கவும்.',
        'NETWORK_ERROR': 'நெட்வொர்க் இணைப்பு தோல்வி. உங்கள் இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
        'INVALID_AUDIO': 'தவறான ஆடியோ கோப்பு. மீண்டும் பதிவு செய்யவும்.',
        'API_KEY_MISSING': 'API கட்டமைப்பு காணவில்லை. ஆதரவைத் தொடர்பு கொள்ளவும்.',
        'LANGUAGE_DETECTION_FAILED': 'மொழி அடையாளம் காணுவதில் தோல்வி. மீண்டும் முயற்சிக்கவும்.'
      },
      bn: {
        'PERMISSION_DENIED': 'ভয়েস রেকর্ডিং এর জন্য আপনার ডিভাইস সেটিংসে মাইক্রোফোন অনুমতি দিন।',
        'RECORDING_FAILED': 'অডিও রেকর্ড করতে পারছি না। আপনার মাইক্রোফোন চেক করুন এবং আবার চেষ্টা করুন।',
        'TRANSCRIPTION_FAILED': 'কথাকে টেক্সটে রূপান্তর করতে ব্যর্থ। আবার চেষ্টা করুন।',
        'CHAT_FAILED': 'AI প্রতিক্রিয়া পেতে ব্যর্থ। আবার চেষ্টা করুন।',
        'NO_SPEECH_DETECTED': 'রেকর্ডিংয়ে কোনো কথা পাওয়া যায়নি। স্পষ্ট করে বলুন এবং আবার চেষ্টা করুন।',
        'NETWORK_ERROR': 'নেটওয়ার্ক সংযোগ ব্যর্থ। আপনার ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন।',
        'INVALID_AUDIO': 'অবৈধ অডিও ফাইল। আবার রেকর্ড করুন।',
        'API_KEY_MISSING': 'API কনফিগারেশন অনুপস্থিত। সাপোর্টের সাথে যোগাযোগ করুন।',
        'LANGUAGE_DETECTION_FAILED': 'ভাষা শনাক্তকরণে ব্যর্থ। আবার চেষ্টা করুন।'
      }
    };

    // Get language-specific message if available
    if (language && errorMessages[language] && errorMessages[language][error.type]) {
      return errorMessages[language][error.type];
    }

    // Fallback to English messages
    switch (error.type) {
      case 'PERMISSION_DENIED':
        return 'Please allow microphone access in your device settings to use voice recording.';
      case 'RECORDING_FAILED':
        return 'Unable to record audio. Please check your microphone and try again.';
      case 'TRANSCRIPTION_FAILED':
        return 'Failed to convert speech to text. Please try again.';
      case 'CHAT_FAILED':
        return 'Failed to get AI response. Please try again.';
      case 'NO_SPEECH_DETECTED':
        return 'No speech was detected in the recording. Please speak clearly and try again.';
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'INVALID_AUDIO':
        return 'Invalid audio file. Please record again.';
      case 'API_KEY_MISSING':
        return 'API configuration missing. Please contact support.';
      case 'LANGUAGE_DETECTION_FAILED':
        return 'Language detection failed. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Cancel current recording - Platform-aware version
   */
  public async cancelRecording(): Promise<void> {
    if (this.recording && this.isRecording) {
      try {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        if (uri) {
          await this.cleanupAudioFile(uri);
        }
      } catch (error) {
        console.warn('Error canceling recording:', error);
      } finally {
        this.recording = null;
        this.isRecording = false;
      }
    }
  }

  /**
   * Test language detection with sample text
   */
  public testLanguageDetection(text: string): { language: string; confidence: number; languageInfo: any } {
    const detection = this.detectIndianLanguage(text);
    const languageInfo = this.getLanguageInfo(detection.language);
    
    return {
      ...detection,
      languageInfo
    };
  }
}

// Create and export singleton instance
const VoiceService = new VoiceServiceClass();

export default VoiceService;

// Also export the class for custom instances
export { VoiceServiceClass };
