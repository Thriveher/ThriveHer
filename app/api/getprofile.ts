import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase configuration
const supabaseUrl = 'https://ibwjjwzomoyhkxugmmmw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac';

const supabase = createClient(supabaseUrl, supabaseKey);

class ProfileAPI {
  // Get current user's complete profile
  static async getProfile() {
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

  // Transform database profile to match the expected format for the UI
  static transformProfileData(profileData) {
    if (!profileData) return null;

    return {
      name: profileData.name || '',
      headline: profileData.summary || '',
      currentCompany: profileData.experience?.[0]?.company || 'Student',
      location: profileData.location || '',
      profileImage: profileData.profile_photo || 'https://via.placeholder.com/100x100/e8f4e9/49654E?text=Profile',
      about: profileData.summary || '',
      experience: profileData.experience?.map(exp => ({
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
      education: profileData.education?.map(edu => ({
        institution: edu.institution || '',
        logo: 'https://via.placeholder.com/40x40/e8f4e9/49654E?text=Edu',
        degree: edu.degree || '',
        duration: edu.start_date && edu.end_date 
          ? `${edu.start_date} - ${edu.end_date}` 
          : edu.start_date || ''
      })) || [],
      projects: profileData.experience?.reduce((projects, exp) => {
        if (exp.key_projects) {
          const expProjects = exp.key_projects.map(project => ({
            name: project,
            description: `Project completed during tenure at ${exp.company}`
          }));
          return [...projects, ...expProjects];
        }
        return projects;
      }, []) || [],
      skills: profileData.skills?.map(skill => ({
        name: skill,
        level: 'intermediate' // Default level since database doesn't store skill levels
      })) || [],
      achievements: profileData.certifications?.map(cert => ({
        title: cert.name,
        date: cert.issuer
      })) || []
    };
  }

  // Get transformed profile data ready for UI consumption
  static async getTransformedProfile() {
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
}

export default ProfileAPI;