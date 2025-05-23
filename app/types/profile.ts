export interface ExperienceItem {
    title: string;
    company: string;
    companyLogo: string;
    duration: string;
    location: string;
    description: string;
  }
  
  export interface EducationItem {
    institution: string;
    logo: string;
    degree: string;
    duration: string;
  }
  
  export interface RecommendationItem {
    name: string;
    title: string;
    image: string;
    text: string;
  }
  
  export interface ProfileData {
    name: string;
    headline: string;
    currentCompany: string;
    location: string;
    connectionCount: string;
    profileImage: string;
    bannerImage: string;
    about: string;
    experience: ExperienceItem[];
    education: EducationItem[];
    skills: string[];
    accomplishments: string[];
    recommendations: RecommendationItem[];
  }