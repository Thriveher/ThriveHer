import { supabase } from '../../lib/supabase';
import Groq from 'groq-sdk';

// Initialize Groq client with hardcoded API key
const groq = new Groq({
  apiKey: 'gsk_YOUR_GROQ_API_KEY_HERE', // Replace with your actual Groq API key
  dangerouslyAllowBrowser: true // Only for client-side usage
});

// Enhanced type definitions
interface EducationEntry {
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  coursework?: string[];
  projects?: string[];
  achievements?: string[];
  description?: string; // Generated: What you learned/studied
}

interface ExperienceEntry {
  company: string;
  position: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  employment_type?: string; // Full-time, Part-time, Internship, etc.
  responsibilities?: string[];
  achievements?: string[];
  skills_used?: string[];
  description?: string; // Generated: What you learned in the job
  key_projects?: string[];
}

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  profilePhoto?: string | null;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  skills?: string[];
  summary?: string; // Generated professional summary
  strengths?: string[]; // Generated based on experience and skills
  certifications?: string[];
  languages?: string[];
  interests?: string[];
}

interface EnhancedProfilePayload {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  profile_photo?: string | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: string[];
  summary: string;
  strengths: string[];
  certifications: string[];
  languages: string[];
  interests: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}

interface GroqEnhancementRequest {
  name: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: string[];
  certifications?: string[];
}

interface GroqEnhancementResponse {
  summary: string;
  strengths: string[];
  enhanced_education: EducationEntry[];
  enhanced_experience: ExperienceEntry[];
}

export class ProfileAPI {
  // Hardcoded configuration
  private static readonly GROQ_API_KEY = 'gsk_YOUR_GROQ_API_KEY_HERE'; // Replace with your actual Groq API key
  private static readonly SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'; // Replace with your Supabase URL
  private static readonly SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'; // Replace with your Supabase anon key

  // Generate enhanced profile data using Groq
  private static async enhanceProfileWithGroq(profileData: ProfileData): Promise<GroqEnhancementResponse> {
    try {
      const prompt = `
You are a professional resume writer and career counselor. Based on the following profile information, enhance the profile with detailed, professional content. Generate realistic and relevant information based on the provided data.

Profile Data:
${JSON.stringify({
  name: profileData.name,
  education: profileData.education || [],
  experience: profileData.experience || [],
  skills: profileData.skills || [],
  certifications: profileData.certifications || []
}, null, 2)}

Please respond with a JSON object following this exact structure:
{
  "summary": "A 3-4 sentence professional summary highlighting key strengths, experience, and career goals",
  "strengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4", "Strength 5"],
  "enhanced_education": [
    {
      "institution": "Same as input",
      "degree": "Same as input",
      "field_of_study": "Relevant field if not provided",
      "description": "2-3 sentences about what was studied, key subjects, methodologies learned, and how it applies to career goals"
    }
  ],
  "enhanced_experience": [
    {
      "company": "Same as input",
      "position": "Same as input",
      "description": "2-3 sentences about key learnings, skills developed, impact made, and professional growth achieved in this role",
      "skills_used": ["Skill 1", "Skill 2", "Skill 3"],
      "key_projects": ["Project 1", "Project 2"] // if applicable
    }
  ]
}

Guidelines:
- Keep descriptions professional and concise
- Focus on transferable skills and learning outcomes
- Make strengths specific and relevant to the person's background
- Ensure all enhanced content is realistic and appropriate for the given experience level
- If experience is limited, focus on potential, academic projects, and foundational skills
- Do not invent specific company details, dates, or unrealistic achievements
`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional resume writer. Always respond with valid JSON only, no additional text or formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-70b-versatile",
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Groq API');
      }

      // Parse JSON response
      const enhancedData: GroqEnhancementResponse = JSON.parse(response);
      
      return enhancedData;

    } catch (error) {
      console.error('Groq enhancement error:', error);
      // Return fallback data if Groq fails
      return {
        summary: `${profileData.name} is a dedicated professional with experience in ${profileData.skills?.slice(0, 3).join(', ') || 'various fields'}. Committed to continuous learning and delivering high-quality results.`,
        strengths: profileData.skills?.slice(0, 5) || ['Problem Solving', 'Communication', 'Teamwork', 'Adaptability', 'Leadership'],
        enhanced_education: profileData.education || [],
        enhanced_experience: profileData.experience || []
      };
    }
  }

  // Create comprehensive profile with AI enhancement
  static async createProfile(profileData: ProfileData): Promise<ApiResponse> {
    try {
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!profileData.name?.trim() || !profileData.email?.trim()) {
        throw new Error('Name and email are required');
      }

      // Enhance profile data with Groq
      const enhancedData = await this.enhanceProfileWithGroq(profileData);

      // Merge original data with enhanced data
      const enhancedEducation = profileData.education?.map((edu, index) => ({
        ...edu,
        description: enhancedData.enhanced_education[index]?.description || edu.description,
        field_of_study: enhancedData.enhanced_education[index]?.field_of_study || edu.field_of_study
      })) || [];

      const enhancedExperience = profileData.experience?.map((exp, index) => ({
        ...exp,
        description: enhancedData.enhanced_experience[index]?.description || exp.description,
        skills_used: enhancedData.enhanced_experience[index]?.skills_used || exp.skills_used || [],
        key_projects: enhancedData.enhanced_experience[index]?.key_projects || exp.key_projects || []
      })) || [];

      // Prepare comprehensive profile payload
      const profilePayload: EnhancedProfilePayload = {
        user_id: user.id,
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone?.trim() || null,
        location: profileData.location?.trim() || null,
        linkedin: profileData.linkedin?.trim() || null,
        github: profileData.github?.trim() || null,
        portfolio: profileData.portfolio?.trim() || null,
        profile_photo: profileData.profilePhoto || null,
        education: this.filterValidEntries(enhancedEducation, ['institution', 'degree']),
        experience: this.filterValidEntries(enhancedExperience, ['company', 'position']),
        skills: profileData.skills || [],
        summary: enhancedData.summary,
        strengths: enhancedData.strengths,
        certifications: profileData.certifications || [],
        languages: profileData.languages || [],
        interests: profileData.interests || [],
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert profile in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .insert(profilePayload)
        .select();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data[0],
        message: 'Profile created successfully with AI-enhanced content'
      };

    } catch (error) {
      console.error('ProfileAPI.createProfile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create profile'
      };
    }
  }

  // Get user profile data
  static async getProfile(userId?: string): Promise<ApiResponse> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not authenticated');
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || null,
        message: data ? 'Profile retrieved successfully' : 'No profile found'
      };

    } catch (error) {
      console.error('ProfileAPI.getProfile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve profile'
      };
    }
  }

  // Update specific profile fields
  static async updateProfile(updates: Partial<ProfileData>): Promise<ApiResponse> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // If updating education or experience, enhance with Groq
      let enhancedUpdates = { ...updates };
      
      if (updates.education || updates.experience || updates.skills) {
        const currentProfile = await this.getProfile();
        if (currentProfile.success && currentProfile.data) {
          const profileForEnhancement = {
            ...currentProfile.data,
            ...updates
          };
          
          const enhancedData = await this.enhanceProfileWithGroq(profileForEnhancement);
          
          if (updates.education) {
            enhancedUpdates.education = updates.education.map((edu, index) => ({
              ...edu,
              description: enhancedData.enhanced_education[index]?.description || edu.description,
              field_of_study: enhancedData.enhanced_education[index]?.field_of_study || edu.field_of_study
            }));
          }
          
          if (updates.experience) {
            enhancedUpdates.experience = updates.experience.map((exp, index) => ({
              ...exp,
              description: enhancedData.enhanced_experience[index]?.description || exp.description,
              skills_used: enhancedData.enhanced_experience[index]?.skills_used || exp.skills_used || [],
              key_projects: enhancedData.enhanced_experience[index]?.key_projects || exp.key_projects || []
            }));
          }
        }
      }

      const updatePayload = {
        ...enhancedUpdates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('user_id', user.id)
        .select();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data[0],
        message: 'Profile updated successfully'
      };

    } catch (error) {
      console.error('ProfileAPI.updateProfile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update profile'
      };
    }
  }

  // Upload profile photo to Supabase Storage
  static async uploadProfilePhoto(file: File, userId?: string): Promise<ApiResponse> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not authenticated');
        }
        targetUserId = user.id;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Create file path
      const fileExt = file.name.split('.').pop();
      const fileName = `profile_${targetUserId}_${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (error) {
        throw new Error(`Storage error: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: filePath,
          publicUrl: publicUrl
        },
        message: 'Photo uploaded successfully'
      };

    } catch (error) {
      console.error('ProfileAPI.uploadProfilePhoto error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to upload photo'
      };
    }
  }

  // Helper method to filter valid entries
  private static filterValidEntries<T extends Record<string, any>>(
    entries: T[], 
    requiredFields: string[]
  ): T[] {
    if (!Array.isArray(entries)) return [];
    
    return entries.filter(entry => {
      return requiredFields.some(field => entry[field] && entry[field].trim());
    });
  }

  // Generate resume data from profile
  static async generateResumeData(userId?: string): Promise<ApiResponse> {
    try {
      const profileResponse = await this.getProfile(userId);
      
      if (!profileResponse.success || !profileResponse.data) {
        throw new Error('Profile not found');
      }

      const profile = profileResponse.data;
      
      // Structure data for resume generation
      const resumeData = {
        personal_info: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          linkedin: profile.linkedin,
          github: profile.github,
          portfolio: profile.portfolio,
          profile_photo: profile.profile_photo
        },
        summary: profile.summary,
        strengths: profile.strengths,
        education: profile.education,
        experience: profile.experience,
        skills: profile.skills,
        certifications: profile.certifications,
        languages: profile.languages,
        interests: profile.interests
      };

      return {
        success: true,
        data: resumeData,
        message: 'Resume data generated successfully'
      };

    } catch (error) {
      console.error('ProfileAPI.generateResumeData error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to generate resume data'
      };
    }
  }

  // Utility method to validate API keys configuration
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (this.GROQ_API_KEY === 'gsk_YOUR_GROQ_API_KEY_HERE') {
      errors.push('Groq API key not configured');
    }
    
    if (this.SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
      errors.push('Supabase URL not configured');
    }
    
    if (this.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
      errors.push('Supabase Anon Key not configured');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}