import { supabase } from '../../lib/supabase';
import Groq from 'groq-sdk';

// Initialize Groq client with hardcoded API key
const groq = new Groq({
  apiKey: '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', // Replace with your actual Groq API key
  dangerouslyAllowBrowser: true // Only for client-side usage
});

// Form data types (matching your component)
interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  startYear: string;
  endYear: string;
  location: string;
}

interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  location: string;
}

interface FormData {
  name: string;
  email: string;
  profilePhoto: string | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: string[];
}

// Enhanced database types
interface DatabaseEducationEntry {
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

  // Updated type definitions to match the actual data structure
interface DatabaseEducationEntry {
  institution: string;
  degree: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  field_of_study?: string;
  description?: string;
  relevant_coursework?: string[];
  projects?: string[];
}

interface DatabaseExperienceEntry {
  company: string;
  position: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  description?: string;
  skills_used?: string[];
  key_projects?: string[];
  achievements?: string[];
}

interface GroqEnhancementResponse {
  summary: string;
  strengths: string[];
  enhanced_education: {
    institution: string;
    degree: string;
    field_of_study?: string;
    description: string;
    relevant_coursework?: string[];
    projects?: string[];
  }[];
  enhanced_experience: {
    company: string;
    position: string;
    description: string;
    skills_used?: string[];
    key_projects?: string[];
    achievements?: string[];
  }[];
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
  education: DatabaseEducationEntry[];
  experience: DatabaseExperienceEntry[];
  skills: string[];
  summary: string;
  strengths: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface DatabaseExperienceEntry {
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
  education?: DatabaseEducationEntry[];
  experience?: DatabaseExperienceEntry[];
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
  education: DatabaseEducationEntry[];
  experience: DatabaseExperienceEntry[];
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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface GroqEnhancementRequest {
  name: string;
  education: DatabaseEducationEntry[];
  experience: DatabaseExperienceEntry[];
  skills: string[];
  certifications?: string[];
}

interface GroqEnhancementResponse {
  summary: string;
  strengths: string[];
  enhanced_education: DatabaseEducationEntry[];
  enhanced_experience: DatabaseExperienceEntry[];
}

export class ProfileAPI {
  // Hardcoded configuration
  private static readonly GROQ_API_KEY = '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'; // Replace with your actual Groq API key
  private static readonly SUPABASE_URL = 'https://ibwjjwzomoyhkxugmmmw.supabase.co'; // Replace with your Supabase URL
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac'; // Replace with your Supabase anon key

  // Validate profile data (matching your component's validation)
static validateProfileData(data: FormData): ValidationResult {
  const errors: string[] = [];
  
  if (!data.name?.trim()) {
    errors.push('Name is required');
  }
  
  if (!data.email?.trim()) {
    errors.push('Email is required');
  }

  // Additional validations
  if (data.name && data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (data.email && !this.isValidEmail(data.email.trim())) {
    errors.push('Please enter a valid email address');
  }

  // Validate education entries
  if (data.education && data.education.length > 0) {
    data.education.forEach((edu, index) => {
      if (edu.institution?.trim() || edu.degree?.trim()) {
        if (!edu.institution?.trim()) {
          errors.push(`Education entry ${index + 1}: Institution name is required`);
        }
        if (!edu.degree?.trim()) {
          errors.push(`Education entry ${index + 1}: Degree is required`);
        }
      }
    });
  }

  // Validate experience entries
  if (data.experience && data.experience.length > 0) {
    data.experience.forEach((exp, index) => {
      if (exp.company?.trim() || exp.position?.trim()) {
        if (!exp.company?.trim()) {
          errors.push(`Experience entry ${index + 1}: Company name is required`);
        }
        if (!exp.position?.trim()) {
          errors.push(`Experience entry ${index + 1}: Position is required`);
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper method to validate email format
private static isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Convert form data to database format
private static convertFormDataToProfileData(formData: FormData): ProfileData {
  const education: DatabaseEducationEntry[] = formData.education
    ?.filter(edu => edu.institution?.trim() && edu.degree?.trim())
    ?.map(edu => ({
      institution: edu.institution.trim(),
      degree: edu.degree.trim(),
      start_date: edu.startYear || undefined,
      end_date: edu.endYear || undefined,
      location: edu.location?.trim() || undefined,
    })) || [];

  const experience: DatabaseExperienceEntry[] = formData.experience
    ?.filter(exp => exp.company?.trim() && exp.position?.trim())
    ?.map(exp => ({
      company: exp.company.trim(),
      position: exp.position.trim(),
      start_date: exp.startYear || undefined,
      end_date: exp.endYear || undefined,
      location: exp.location?.trim() || undefined,
    })) || [];

  return {
    name: formData.name.trim(),
    email: formData.email.trim(),
    profilePhoto: formData.profilePhoto,
    education,
    experience,
    skills: formData.skills || [],
  };
}

// Generate fallback content when AI enhancement fails
private static generateFallbackContent(profileData: ProfileData): GroqEnhancementResponse {
  const fallbackSummary = this.generateFallbackSummary(profileData);
  const fallbackStrengths = this.generateFallbackStrengths(profileData);
  
  const enhanced_education = profileData.education?.map(edu => ({
    institution: edu.institution,
    degree: edu.degree,
    field_of_study: this.extractFieldFromDegree(edu.degree),
    description: `I studied ${edu.degree} at ${edu.institution}, where I gained comprehensive knowledge and developed essential skills in my field of study.`,
    relevant_coursework: this.generateRelevantCoursework(edu.degree),
    projects: [`Academic project related to ${edu.degree}`, `Research work in ${this.extractFieldFromDegree(edu.degree)}`]
  })) || [];

  const enhanced_experience = profileData.experience?.map(exp => ({
    company: exp.company,
    position: exp.position,
    description: `In my role as ${exp.position} at ${exp.company}, I contributed to important projects and developed valuable professional skills that enhanced my expertise in the field.`,
    skills_used: this.generateSkillsFromPosition(exp.position),
    key_projects: [`Project management at ${exp.company}`, `Strategic initiatives in ${exp.position} role`],
    achievements: [`Successfully fulfilled ${exp.position} responsibilities`, `Contributed to team objectives at ${exp.company}`]
  })) || [];

  return {
    summary: fallbackSummary,
    strengths: fallbackStrengths,
    enhanced_education,
    enhanced_experience
  };
}

private static generateFallbackSummary(profileData: ProfileData): string {
  const hasEducation = profileData.education && profileData.education.length > 0;
  const hasExperience = profileData.experience && profileData.experience.length > 0;
  const hasSkills = profileData.skills && profileData.skills.length > 0;

  let summary = `I am a dedicated professional with a strong commitment to excellence and continuous learning. `;

  if (hasEducation) {
    const education = profileData.education[0];
    summary += `I hold a ${education.degree} from ${education.institution}, which provided me with a solid foundation in my field. `;
  }

  if (hasExperience) {
    const experience = profileData.experience[0];
    summary += `My experience as ${experience.position} at ${experience.company} has allowed me to develop practical skills and contribute meaningfully to organizational objectives. `;
  }

  if (hasSkills) {
    summary += `I possess expertise in ${profileData.skills.slice(0, 3).join(', ')} and am passionate about applying these skills to create value. `;
  }

  summary += `I am eager to bring my knowledge and enthusiasm to new challenges and opportunities.`;

  return summary;
}

private static generateFallbackStrengths(profileData: ProfileData): string[] {
  const baseStrengths = [
    'Problem-solving abilities',
    'Team collaboration',
    'Communication skills',
    'Adaptability',
    'Attention to detail',
    'Time management',
    'Critical thinking',
    'Leadership potential'
  ];

  // Add skill-based strengths if available
  if (profileData.skills && profileData.skills.length > 0) {
    profileData.skills.forEach(skill => {
      baseStrengths.push(`${skill} expertise`);
    });
  }

  return baseStrengths.slice(0, 8);
}

private static extractFieldFromDegree(degree: string): string {
  const degreeWords = degree.toLowerCase();
  
  if (degreeWords.includes('computer') || degreeWords.includes('software')) return 'Computer Science';
  if (degreeWords.includes('business') || degreeWords.includes('management')) return 'Business Administration';
  if (degreeWords.includes('engineering')) return 'Engineering';
  if (degreeWords.includes('science')) return 'Science';
  if (degreeWords.includes('arts') || degreeWords.includes('liberal')) return 'Liberal Arts';
  if (degreeWords.includes('psychology')) return 'Psychology';
  if (degreeWords.includes('marketing')) return 'Marketing';
  if (degreeWords.includes('finance')) return 'Finance';
  
  return 'General Studies';
}

private static generateRelevantCoursework(degree: string): string[] {
  const degreeWords = degree.toLowerCase();
  
  if (degreeWords.includes('computer') || degreeWords.includes('software')) {
    return ['Data Structures', 'Algorithms', 'Software Engineering', 'Database Systems', 'Web Development'];
  }
  if (degreeWords.includes('business')) {
    return ['Strategic Management', 'Financial Analysis', 'Marketing Principles', 'Operations Management', 'Leadership'];
  }
  if (degreeWords.includes('engineering')) {
    return ['Engineering Mathematics', 'Design Principles', 'Project Management', 'Technical Analysis', 'Systems Design'];
  }
  
  return ['Core Curriculum', 'Research Methods', 'Critical Analysis', 'Communication', 'Ethics'];
}

private static generateSkillsFromPosition(position: string): string[] {
  const positionWords = position.toLowerCase();
  
  if (positionWords.includes('developer') || positionWords.includes('programmer')) {
    return ['Programming', 'Software Development', 'Problem Solving', 'Code Review', 'Testing'];
  }
  if (positionWords.includes('manager') || positionWords.includes('lead')) {
    return ['Team Leadership', 'Project Management', 'Strategic Planning', 'Communication', 'Decision Making'];
  }
  if (positionWords.includes('analyst')) {
    return ['Data Analysis', 'Research', 'Report Writing', 'Critical Thinking', 'Problem Solving'];
  }
  if (positionWords.includes('designer')) {
    return ['Design Software', 'Creative Problem Solving', 'Visual Communication', 'User Experience', 'Prototyping'];
  }
  
  return ['Professional Communication', 'Time Management', 'Teamwork', 'Adaptability', 'Organization'];
}

// Enhanced Groq API call with robust error handling and retries
private static async enhanceProfileWithGroq(profileData: ProfileData): Promise<GroqEnhancementResponse> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  // Check if Groq is properly configured
  if (!this.GROQ_API_KEY || this.GROQ_API_KEY.startsWith('gsk_YOUR_GROQ_API_KEY')) {
    console.warn('Groq API key not configured, using fallback content');
    return this.generateFallbackContent(profileData);
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Groq enhancement attempt ${attempt}/${maxRetries}`);
      
      const prompt = `
You are helping someone write their professional profile in their own voice. Based on the provided information, create comprehensive, realistic content that sounds like the person is describing their own experiences and achievements.

Profile Data:
${JSON.stringify({
  name: profileData.name,
  education: profileData.education || [],
  experience: profileData.experience || [],
  skills: profileData.skills || [],
}, null, 2)}

Generate detailed, first-person content that sounds authentic and professional. Make educated assumptions based on typical experiences at similar institutions/companies, but keep everything realistic.

Respond with a JSON object following this exact structure (no additional text, only JSON):
{
  "summary": "A compelling 4-5 sentence professional summary written in first person",
  "strengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4", "Strength 5", "Strength 6", "Strength 7", "Strength 8"],
  "enhanced_education": [
    {
      "institution": "Same as input",
      "degree": "Same as input",
      "field_of_study": "Relevant field based on degree",
      "description": "3-4 sentences in first person about education experience",
      "relevant_coursework": ["Course 1", "Course 2", "Course 3", "Course 4", "Course 5"],
      "projects": ["Academic project 1", "Academic project 2", "Academic project 3"]
    }
  ],
  "enhanced_experience": [
    {
      "company": "Same as input",
      "position": "Same as input", 
      "description": "4-5 sentences in first person about work experience",
      "skills_used": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
      "key_projects": ["Project 1", "Project 2", "Project 3"],
      "achievements": ["Achievement 1", "Achievement 2", "Achievement 3"]
    }
  ]
}`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional career counselor. Always respond with valid JSON only, no additional text. Make all content realistic and specific to their background."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: 4000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from Groq API');
      }

      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response.trim();
      let jsonStartIndex = cleanedResponse.indexOf('{');
      let jsonEndIndex = cleanedResponse.lastIndexOf('}');
      
      if (jsonStartIndex === -1 || jsonEndIndex === -1) {
        throw new Error('No valid JSON found in response');
      }
      
      const jsonString = cleanedResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      
      // Parse JSON response with validation
      const enhancedData: GroqEnhancementResponse = JSON.parse(jsonString);
      
      // Validate the structure
      if (!enhancedData.summary || !enhancedData.strengths || !Array.isArray(enhancedData.strengths)) {
        throw new Error('Invalid response structure from Groq API');
      }
      
      console.log('Groq enhancement successful');
      return enhancedData;
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`Groq enhancement attempt ${attempt} failed:`, error);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // If all attempts failed, use fallback content
  console.warn('All Groq enhancement attempts failed, using fallback content:', lastError?.message);
  return this.generateFallbackContent(profileData);
}

// Create comprehensive profile with extensive AI enhancement
static async createProfile(formData: FormData): Promise<ApiResponse> {
  try {
    console.log('Starting profile creation...');
    
    // Validate form data first
    const validation = this.validateProfileData(formData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0],
        message: 'Validation failed'
      };
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Convert form data to profile data
    const profileData = this.convertFormDataToProfileData(formData);
    console.log('Profile data converted:', profileData);

    // Enhance profile data with comprehensive generation (with fallback)
    const enhancedData = await this.enhanceProfileWithGroq(profileData);
    console.log('Profile data enhanced');

    // Merge original data with enhanced data
    const enhancedEducation = profileData.education?.map((edu, index) => ({
      ...edu,
      description: enhancedData.enhanced_education[index]?.description || `During my time at ${edu.institution}, I gained valuable knowledge and skills that have shaped my professional development.`,
      field_of_study: enhancedData.enhanced_education[index]?.field_of_study || this.extractFieldFromDegree(edu.degree),
      relevant_coursework: enhancedData.enhanced_education[index]?.relevant_coursework || [],
      projects: enhancedData.enhanced_education[index]?.projects || []
    })) || [];

    const enhancedExperience = profileData.experience?.map((exp, index) => ({
      ...exp,
      description: enhancedData.enhanced_experience[index]?.description || `In my role as ${exp.position} at ${exp.company}, I contributed to important projects and developed valuable professional skills.`,
      skills_used: enhancedData.enhanced_experience[index]?.skills_used || [],
      key_projects: enhancedData.enhanced_experience[index]?.key_projects || [],
      achievements: enhancedData.enhanced_experience[index]?.achievements || []
    })) || [];

    // Prepare profile payload
    const profilePayload: EnhancedProfilePayload = {
      user_id: user.id,
      name: profileData.name,
      email: profileData.email,
      phone: undefined,
      location: undefined,
      linkedin: undefined,
      github: undefined,
      portfolio: undefined,
      profile_photo: profileData.profilePhoto || null,
      education: enhancedEducation,
      experience: enhancedExperience,
      skills: profileData.skills || [],
      summary: enhancedData.summary,
      strengths: enhancedData.strengths || [],
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Inserting profile into database...');

    // Insert profile in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .insert(profilePayload)
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Profile created successfully');

    return {
      success: true,
      data: data[0],
      message: 'Profile created successfully with enhanced content'
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

// Update specific profile fields with enhancement
static async updateProfile(updates: Partial<ProfileData>): Promise<ApiResponse> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // If updating education or experience, enhance with generation (with fallback)
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
            field_of_study: enhancedData.enhanced_education[index]?.field_of_study || edu.field_of_study,
            relevant_coursework: enhancedData.enhanced_education[index]?.relevant_coursework || [],
            projects: enhancedData.enhanced_education[index]?.projects || []
          }));
        }
        
        if (updates.experience) {
          enhancedUpdates.experience = updates.experience.map((exp, index) => ({
            ...exp,
            description: enhancedData.enhanced_experience[index]?.description || exp.description,
            skills_used: enhancedData.enhanced_experience[index]?.skills_used || exp.skills_used || [],
            key_projects: enhancedData.enhanced_experience[index]?.key_projects || exp.key_projects || [],
            achievements: enhancedData.enhanced_experience[index]?.achievements || []
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
      message: 'Profile updated successfully with enhanced content'
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
      skills: profile.skills
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

// Generate a profile report
static async generateProfileReport(userId?: string): Promise<ApiResponse> {
  try {
    const profileResponse = await this.getProfile(userId);
    
    if (!profileResponse.success || !profileResponse.data) {
      throw new Error('Profile not found');
    }

    const profile = profileResponse.data;
    
    // Calculate profile completeness
    const fields = [
      'name', 'email', 'summary', 'education', 'experience', 'skills', 'strengths'
    ];
    
    const completedFields = fields.filter(field => {
      const value = profile[field];
      return value && (typeof value === 'string' ? value.trim() : value.length > 0);
    });
    
    const completeness = Math.round((completedFields.length / fields.length) * 100);
    
    const report = {
      completeness_percentage: completeness,
      completed_sections: completedFields,
      missing_sections: fields.filter(field => !completedFields.includes(field)),
      total_skills: profile.skills?.length || 0,
      education_count: profile.education?.length || 0,
      experience_count: profile.experience?.length || 0,
      profile_strength: completeness >= 80 ? 'Strong' : completeness >= 60 ? 'Good' : 'Needs Improvement'
    };

    return {
      success: true,
      data: report,
      message: 'Profile report generated successfully'
    };
  } catch (error) {
    console.error('ProfileAPI.generateProfileReport error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to generate profile report'
    };
  }
}

// Utility method to validate API keys configuration
static validateConfiguration(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const groqApiKey = this.GROQ_API_KEY;
  const supabaseUrl = this.SUPABASE_URL;
  const supabaseAnonKey = this.SUPABASE_ANON_KEY;
  
  if (!groqApiKey || groqApiKey.startsWith('gsk_YOUR_GROQ_API_KEY')) {
    errors.push('Groq API key not configured - will use fallback content');
  }
  
  if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
    errors.push('Supabase URL not configured');
  }
  
  if (!supabaseAnonKey || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    errors.push('Supabase Anon Key not configured');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}