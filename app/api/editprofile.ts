import { createClient } from '@supabase/supabase-js';

// Type definitions
interface Experience {
  title?: string;
  company?: string;
  companyLogo?: string;
  duration?: string;
  location?: string;
  position?: string;
  start_date?: string;
  end_date?: string | null;
  key_projects?: string[];
}

interface Education {
  institution?: string;
  logo?: string;
  degree?: string;
  duration?: string;
  start_date?: string;
  end_date?: string;
}

interface Project {
  name?: string;
  description?: string;
}

interface Skill {
  name?: string;
  level?: string;
}

interface Achievement {
  title?: string;
  date?: string;
}

interface Certification {
  name?: string;
  issuer?: string;
}

interface UIProfileData {
  name?: string;
  headline?: string;
  about?: string;
  location?: string;
  profileImage?: string;
  currentCompany?: string;
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  skills?: (string | Skill)[];
  achievements?: Achievement[];
}

interface DatabaseProfileData {
  name?: string;
  summary?: string;
  location?: string;
  profile_photo?: string | null;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  certifications?: Certification[];
}

interface ProfileRecord extends DatabaseProfileData {
  user_id: string;
  updated_at: string;
  created_at?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}

// Hardcoded Supabase configuration
const supabaseUrl = 'https://ibwjjwzomoyhkxugmmmw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac';
const supabase = createClient(supabaseUrl, supabaseKey);

class ProfileAPI {
  // Get current user's complete profile
  static async getProfile(): Promise<ApiResponse<ProfileRecord | null>> {
    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Fetch profile data for the authenticated user
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
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

  // Transform UI profile data to database format
  static transformUIToDatabase(profileData: UIProfileData | null): DatabaseProfileData | null {
    if (!profileData) return null;
    
    return {
      name: profileData.name || '',
      summary: profileData.headline || profileData.about || '',
      location: profileData.location || '',
      profile_photo: profileData.profileImage || null,
      experience: profileData.experience?.map((exp: Experience) => ({
        position: exp.title || '',
        company: exp.company || '',
        location: exp.location || '',
        start_date: exp.duration ? exp.duration.split(' - ')[0] : '',
        end_date: exp.duration && exp.duration.includes(' - ') && !exp.duration.includes('Present') 
          ? exp.duration.split(' - ')[1] 
          : null,
        key_projects: [] // Will be populated from projects if needed
      })) || [],
      education: profileData.education?.map((edu: Education) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        start_date: edu.duration ? edu.duration.split(' - ')[0] : '',
        end_date: edu.duration && edu.duration.includes(' - ') 
          ? edu.duration.split(' - ')[1] 
          : edu.duration || ''
      })) || [],
      skills: profileData.skills?.map((skill: string | Skill) => 
        typeof skill === 'string' ? skill : skill.name || ''
      ) || [],
      certifications: profileData.achievements?.map((achievement: Achievement) => ({
        name: achievement.title || '',
        issuer: achievement.date || ''
      })) || []
    };
  }

  // Transform database profile to match the expected format for the UI
  static transformProfileData(profileData: ProfileRecord | null): UIProfileData | null {
    if (!profileData) return null;
    
    return {
      name: profileData.name || '',
      headline: profileData.summary || '',
      currentCompany: profileData.experience?.[0]?.company || 'Student',
      location: profileData.location || '',
      profileImage: profileData.profile_photo || 'https://via.placeholder.com/100x100/e8f4e9/49654E?text=Profile',
      about: profileData.summary || '',
      experience: profileData.experience?.map((exp: Experience) => ({
        title: exp.position || '',
        company: exp.company || '',
        companyLogo: 'https://via.placeholder.com/40x40/e8f4e9/49654E?text=Co',
        duration: exp.start_date && exp.end_date 
          ? `${exp.start_date} - ${exp.end_date}` 
          : exp.start_date 
          ? `${exp.start_date} - Present` 
          : '',
        location: exp.location || ''
      })) || [],
      education: profileData.education?.map((edu: Education) => ({
        institution: edu.institution || '',
        logo: 'https://via.placeholder.com/40x40/e8f4e9/49654E?text=Edu',
        degree: edu.degree || '',
        duration: edu.start_date && edu.end_date 
          ? `${edu.start_date} - ${edu.end_date}` 
          : edu.start_date || ''
      })) || [],
      projects: profileData.experience?.reduce((projects: Project[], exp: Experience) => {
        if (exp.key_projects) {
          const expProjects = exp.key_projects.map((project: string) => ({
            name: project,
            description: `Project completed during tenure at ${exp.company || 'Unknown Company'}`
          }));
          return [...projects, ...expProjects];
        }
        return projects;
      }, []) || [],
      skills: profileData.skills?.map((skill: string) => ({
        name: skill,
        level: 'intermediate' // Default level since database doesn't store skill levels
      })) || [],
      achievements: profileData.certifications?.map((cert: Certification) => ({
        title: cert.name || '',
        date: cert.issuer || ''
      })) || []
    };
  }

  // Save/Update profile data
  static async saveProfile(profileData: UIProfileData): Promise<ApiResponse<ProfileRecord>> {
    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Transform UI data to database format
      const databaseData = this.transformUIToDatabase(profileData);
      
      // Add user_id and updated_at timestamp
      const dataToSave: Partial<ProfileRecord> = {
        ...databaseData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let result;
      
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update(dataToSave)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new profile
        const newProfileData = {
          ...dataToSave,
          created_at: new Date().toISOString()
        };
        result = await supabase
          .from('profiles')
          .insert([newProfileData])
          .select()
          .single();
      }
      
      if (result.error) {
        throw new Error(`Database error: ${result.error.message}`);
      }
      
      return {
        success: true,
        data: result.data,
        message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully'
      };
    } catch (error) {
      console.error('ProfileAPI.saveProfile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to save profile'
      };
    }
  }

  // Update specific profile fields
  static async updateProfileField(fieldName: string, fieldValue: any): Promise<ApiResponse<ProfileRecord>> {
    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      const updateData = {
        [fieldName]: fieldValue,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return {
        success: true,
        data: data,
        message: `${fieldName} updated successfully`
      };
    } catch (error) {
      console.error('ProfileAPI.updateProfileField error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: `Failed to update ${fieldName}`
      };
    }
  }

  // Delete profile
  static async deleteProfile(): Promise<ApiResponse<void>> {
    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return {
        success: true,
        message: 'Profile deleted successfully'
      };
    } catch (error) {
      console.error('ProfileAPI.deleteProfile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete profile'
      };
    }
  }

  // Get transformed profile data ready for UI consumption
  static async getTransformedProfile(): Promise<ApiResponse<UIProfileData | null>> {
    try {
      const response = await this.getProfile();
      
      if (!response.success) {
        return response;
      }
      
      const transformedData = this.transformProfileData(response.data);
      
      return {
        success: true,
        data: transformedData,
        message: 'Profile data transformed successfully'
      };
    } catch (error) {
      console.error('ProfileAPI.getTransformedProfile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to get transformed profile data'
      };
    }
  }

  // Batch update multiple profile sections
  static async batchUpdateProfile(updates: Partial<DatabaseProfileData>): Promise<ApiResponse<ProfileRecord>> {
    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return {
        success: true,
        data: data,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('ProfileAPI.batchUpdateProfile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update profile'
      };
    }
  }
}

export default ProfileAPI;