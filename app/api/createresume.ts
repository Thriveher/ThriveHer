import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase configuration
const SUPABASE_URL = 'https://ibwjjwzomoyhkxugmmmw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types
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

interface Certification {
  name: string;
  issuer?: string;
  description?: string;
}

interface ProfileData {
  user_id: string;
  name: string;
  email: string;
  education: DatabaseEducationEntry[];
  experience: DatabaseExperienceEntry[];
  skills: string[];
  summary: string;
  strengths: string[];
  certifications: any[];
  languages: string[];
  interests: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface ResumeGenerationResponse {
  success: boolean;
  data?: {
    pdfUrl: string;
    filePath: string;
    fileName: string;
    pdfBlob: Blob;
  };
  error?: string;
  message: string;
}

// Load external libraries dynamically
async function loadExternalLibraries(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.jsPDF && window.html2canvas) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalLibraries = 2;

    function checkComplete() {
      loadedCount++;
      if (loadedCount === totalLibraries) {
        setTimeout(() => {
          if (window.jsPDF && window.html2canvas) {
            resolve();
          } else {
            reject(new Error('Libraries loaded but not accessible'));
          }
        }, 100);
      }
    }

    if (!window.html2canvas) {
      const html2canvasScript = document.createElement('script');
      html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      html2canvasScript.onload = checkComplete;
      html2canvasScript.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(html2canvasScript);
    } else {
      checkComplete();
    }

    if (!window.jsPDF) {
      const jspdfScript = document.createElement('script');
      jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jspdfScript.onload = () => {
        if (window.jspdf && window.jspdf.jsPDF) {
          window.jsPDF = window.jspdf.jsPDF;
        } else if (window.jspdf) {
          window.jsPDF = window.jspdf;
        }
        checkComplete();
      };
      jspdfScript.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(jspdfScript);
    } else {
      checkComplete();
    }
  });
}

// Fetch profile data from Supabase
async function fetchProfileData(userId?: string): Promise<ProfileData> {
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

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  if (!data) {
    throw new Error('Profile not found');
  }

  return data as ProfileData;
}

// Parse certification strings to objects
function parseCertifications(certifications: any[]): Certification[] {
  if (!certifications || certifications.length === 0) {
    return [];
  }

  return certifications
    .map(cert => {
      if (typeof cert === 'string') {
        try {
          const parsed = JSON.parse(cert);
          if (parsed.name && parsed.name.trim() !== '') {
            return {
              name: parsed.name.trim(),
              issuer: parsed.issuer || '',
              description: parsed.description || ''
            };
          }
        } catch (e) {
          if (cert.trim() !== '') {
            return {
              name: cert.trim(),
              issuer: '',
              description: ''
            };
          }
        }
      } else if (cert && typeof cert === 'object' && cert.name && cert.name.trim() !== '') {
        return {
          name: cert.name.trim(),
          issuer: cert.issuer || '',
          description: cert.description || ''
        };
      }
      return null;
    })
    .filter(cert => cert !== null) as Certification[];
}

// Format date range
function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return '';
  
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  const start = startDate ? formatDate(startDate) : '';
  const end = endDate ? formatDate(endDate) : 'Present';
  
  if (start && end) {
    return `${start} - ${end}`;
  } else if (start) {
    return start;
  } else if (end && end !== 'Present') {
    return end;
  }
  return '';
}

// Create HTML structure for PDF generation
function createResumeHTML(profileData: ProfileData): string {
  const certifications = parseCertifications(profileData.certifications || []);
  
  return `
<div id="resume-content" style="
  width: 8.5in;
  min-height: 11in;
  padding: 0;
  margin: 0 auto;
  background: white;
  font-family: 'Times New Roman', serif;
  font-size: 11pt;
  line-height: 1.4;
  color: #000000;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
">
  <!-- Main Content (Left Section - 70%) -->
  <div style="
    width: 70%;
    padding: 0.75in 0.5in 0.75in 0.75in;
    background: white;
    border-right: 2px solid #000000;
  ">
    <!-- Header -->
    <div style="margin-bottom: 30pt;">
      <h1 style="
        font-size: 24pt;
        font-weight: bold;
        margin: 0 0 8pt 0;
        color: #000000;
        text-transform: uppercase;
        letter-spacing: 2pt;
        text-align: left;
        border-bottom: 3pt solid #000000;
        padding-bottom: 8pt;
      ">${profileData.name}</h1>
      <div style="
        font-size: 11pt;
        color: #000000;
        margin-top: 12pt;
      ">
        <strong>Email:</strong> ${profileData.email}
      </div>
    </div>

    ${profileData.summary && profileData.summary.trim() ? `
    <!-- Professional Summary -->
    <div style="margin-bottom: 25pt;">
      <h2 style="
        font-size: 14pt;
        font-weight: bold;
        color: #000000;
        margin: 0 0 10pt 0;
        text-transform: uppercase;
        letter-spacing: 1pt;
        border-bottom: 1pt solid #000000;
        padding-bottom: 4pt;
      ">PROFESSIONAL SUMMARY</h2>
      <p style="
        margin: 0;
        text-align: justify;
        line-height: 1.5;
        color: #000000;
      ">${profileData.summary}</p>
    </div>
    ` : ''}

    ${profileData.experience && profileData.experience.length > 0 ? `
    <!-- Professional Experience -->
    <div style="margin-bottom: 25pt;">
      <h2 style="
        font-size: 14pt;
        font-weight: bold;
        color: #000000;
        margin: 0 0 15pt 0;
        text-transform: uppercase;
        letter-spacing: 1pt;
        border-bottom: 1pt solid #000000;
        padding-bottom: 4pt;
      ">PROFESSIONAL EXPERIENCE</h2>
      ${profileData.experience.map(exp => `
      <div style="margin-bottom: 20pt; page-break-inside: avoid;">
        <div style="margin-bottom: 8pt;">
          <div style="
            font-size: 12pt;
            font-weight: bold;
            margin: 0 0 4pt 0;
            color: #000000;
          ">${exp.position}</div>
          <div style="
            font-size: 11pt;
            color: #000000;
            font-style: italic;
            margin-bottom: 4pt;
          ">${exp.company}${exp.location ? `, ${exp.location}` : ''}</div>
          <div style="
            font-size: 10pt;
            color: #000000;
            font-weight: bold;
          ">${formatDateRange(exp.start_date, exp.end_date)}</div>
        </div>
        
        ${exp.description ? `
        <div style="margin-bottom: 8pt;">
          <p style="margin: 0; line-height: 1.4; text-align: justify;">${exp.description}</p>
        </div>
        ` : ''}
        
        ${(exp.key_projects && exp.key_projects.length > 0) || (exp.achievements && exp.achievements.length > 0) || (exp.skills_used && exp.skills_used.length > 0) ? `
        <ul style="margin: 0; padding-left: 20pt; list-style-type: disc;">
          ${exp.key_projects && exp.key_projects.length > 0 && exp.key_projects.some(p => p.trim()) ? 
            exp.key_projects.filter(p => p.trim()).map(project => `
              <li style="margin-bottom: 4pt; line-height: 1.4;"><strong>Project:</strong> ${project}</li>
            `).join('') : ''}
          ${exp.achievements && exp.achievements.length > 0 && exp.achievements.some(a => a.trim()) ? 
            exp.achievements.filter(a => a.trim()).map(achievement => `
              <li style="margin-bottom: 4pt; line-height: 1.4;">${achievement}</li>
            `).join('') : ''}
          ${exp.skills_used && exp.skills_used.length > 0 && exp.skills_used.some(s => s.trim()) ? `
            <li style="margin-bottom: 4pt; line-height: 1.4;"><strong>Technologies Used:</strong> ${exp.skills_used.filter(s => s.trim()).join(', ')}</li>
          ` : ''}
        </ul>
        ` : ''}
      </div>
      `).join('')}
    </div>
    ` : ''}

    ${profileData.education && profileData.education.length > 0 ? `
    <!-- Education -->
    <div style="margin-bottom: 25pt;">
      <h2 style="
        font-size: 14pt;
        font-weight: bold;
        color: #000000;
        margin: 0 0 15pt 0;
        text-transform: uppercase;
        letter-spacing: 1pt;
        border-bottom: 1pt solid #000000;
        padding-bottom: 4pt;
      ">EDUCATION</h2>
      ${profileData.education.map(edu => `
      <div style="margin-bottom: 18pt; page-break-inside: avoid;">
        <div style="margin-bottom: 8pt;">
          <div style="
            font-size: 12pt;
            font-weight: bold;
            margin: 0 0 4pt 0;
            color: #000000;
          ">${edu.degree}${edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</div>
          <div style="
            font-size: 11pt;
            color: #000000;
            font-style: italic;
            margin-bottom: 4pt;
          ">${edu.institution}${edu.location ? `, ${edu.location}` : ''}</div>
          <div style="
            font-size: 10pt;
            color: #000000;
            font-weight: bold;
          ">${formatDateRange(edu.start_date, edu.end_date)}</div>
        </div>
        
        ${edu.description ? `
        <div style="margin-bottom: 8pt;">
          <p style="margin: 0; line-height: 1.4; text-align: justify;">${edu.description}</p>
        </div>
        ` : ''}
        
        ${(edu.projects && edu.projects.length > 0) || (edu.relevant_coursework && edu.relevant_coursework.length > 0) ? `
        <div style="margin-top: 8pt;">
          ${edu.projects && edu.projects.length > 0 && edu.projects.some(p => p.trim()) ? `
            <div style="margin-bottom: 6pt;">
              <strong>Notable Projects:</strong> ${edu.projects.filter(p => p.trim()).join(', ')}
            </div>
          ` : ''}
          ${edu.relevant_coursework && edu.relevant_coursework.length > 0 && edu.relevant_coursework.some(c => c.trim()) ? `
            <div style="margin-bottom: 6pt;">
              <strong>Relevant Coursework:</strong> ${edu.relevant_coursework.filter(c => c.trim()).join(', ')}
            </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
      `).join('')}
    </div>
    ` : ''}
  </div>

  <!-- Sidebar (Right Section - 30%) -->
  <div style="
    width: 30%;
    padding: 0.75in 0.75in 0.75in 0.5in;
    background: #f8f8f8;
  ">
    ${profileData.skills && profileData.skills.length > 0 ? `
    <!-- Technical Skills -->
    <div style="margin-bottom: 25pt;">
      <h3 style="
        font-size: 12pt;
        font-weight: bold;
        color: #000000;
        margin: 0 0 12pt 0;
        text-transform: uppercase;
        letter-spacing: 1pt;
        border-bottom: 1pt solid #000000;
        padding-bottom: 4pt;
      ">TECHNICAL SKILLS</h3>
      <ul style="margin: 0; padding-left: 15pt; list-style-type: disc;">
        ${profileData.skills.filter(skill => skill.trim()).map(skill => `
          <li style="margin-bottom: 6pt; line-height: 1.3; font-size: 10pt;">${skill}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${profileData.strengths && profileData.strengths.length > 0 ? `
    <!-- Key Strengths -->
    <div style="margin-bottom: 25pt;">
      <h3 style="
        font-size: 12pt;
        font-weight: bold;
        color: #000000;
        margin: 0 0 12pt 0;
        text-transform: uppercase;
        letter-spacing: 1pt;
        border-bottom: 1pt solid #000000;
        padding-bottom: 4pt;
      ">KEY STRENGTHS</h3>
      <ul style="margin: 0; padding-left: 15pt; list-style-type: disc;">
        ${profileData.strengths.filter(strength => strength.trim()).map(strength => `
          <li style="margin-bottom: 6pt; line-height: 1.3; font-size: 10pt;">${strength}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${certifications.length > 0 ? `
    <!-- Certifications -->
    <div style="margin-bottom: 25pt;">
      <h3 style="
        font-size: 12pt;
        font-weight: bold;
        color: #000000;
        margin: 0 0 12pt 0;
        text-transform: uppercase;
        letter-spacing: 1pt;
        border-bottom: 1pt solid #000000;
        padding-bottom: 4pt;
      ">CERTIFICATIONS</h3>
      <ul style="margin: 0; padding-left: 15pt; list-style-type: disc;">
        ${certifications.map(cert => `
          <li style="margin-bottom: 8pt; line-height: 1.3; font-size: 10pt;">
            <strong>${cert.name}</strong>
            ${cert.issuer ? `<br><em>${cert.issuer}</em>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${profileData.languages && profileData.languages.length > 0 ? `
    <!-- Languages -->
    <div style="margin-bottom: 25pt;">
      <h3 style="
        font-size: 12pt;
        font-weight: bold;
        color: #000000;
        margin: 0 0 12pt 0;
        text-transform: uppercase;
        letter-spacing: 1pt;
        border-bottom: 1pt solid #000000;
        padding-bottom: 4pt;
      ">LANGUAGES</h3>
      <ul style="margin: 0; padding-left: 15pt; list-style-type: disc;">
        ${profileData.languages.filter(lang => lang.trim()).map(language => `
          <li style="margin-bottom: 6pt; line-height: 1.3; font-size: 10pt;">${language}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${profileData.interests && profileData.interests.length > 0 ? `
    <!-- Interests -->
    <div style="margin-bottom: 25pt;">
      <h3 style="
        font-size: 12pt;
        font-weight: bold;
        color: #000000;
        margin: 0 0 12pt 0;
        text-transform: uppercase;
        letter-spacing: 1pt;
        border-bottom: 1pt solid #000000;
        padding-bottom: 4pt;
      ">INTERESTS</h3>
      <ul style="margin: 0; padding-left: 15pt; list-style-type: disc;">
        ${profileData.interests.filter(interest => interest.trim()).map(interest => `
          <li style="margin-bottom: 6pt; line-height: 1.3; font-size: 10pt;">${interest}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
</div>`;
}

// Generate PDF using jsPDF and html2canvas
async function generatePDFFromHTML(html: string, fileName: string): Promise<Blob> {
  await loadExternalLibraries();

  if (!window.jsPDF) {
    throw new Error('jsPDF library failed to load');
  }
  if (!window.html2canvas) {
    throw new Error('html2canvas library failed to load');
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '8.5in';
  container.style.background = 'white';
  document.body.appendChild(container);

  try {
    const element = container.querySelector('#resume-content') as HTMLElement;
    if (!element) {
      throw new Error('Resume content element not found');
    }

    const canvas = await window.html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 816, // 8.5 inches at 96 DPI
      height: Math.ceil(element.scrollHeight * (816 / element.scrollWidth)),
      logging: false
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let PDFClass;
    if (window.jsPDF.jsPDF) {
      PDFClass = window.jsPDF.jsPDF;
    } else if (typeof window.jsPDF === 'function') {
      PDFClass = window.jsPDF;
    } else {
      throw new Error('jsPDF constructor not found');
    }
    
    const pdf = new PDFClass('p', 'mm', 'a4');
    
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const pdfBlob = pdf.output('blob');
    document.body.removeChild(container);
    return pdfBlob;
  } catch (error) {
    document.body.removeChild(container);
    throw error;
  }
}

// Upload PDF to Supabase Storage
async function uploadPdfToStorage(pdfBlob: Blob, fileName: string, userId: string): Promise<{ publicUrl: string; filePath: string }> {
  const filePath = `resumes/${userId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('resume-pdfs')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('resume-pdfs')
    .getPublicUrl(filePath);

  return { publicUrl, filePath };
}

// Main function to generate resume
export async function generateResume(userId?: string): Promise<string> {
  try {
    console.log('Starting resume generation...');
    const profileData = await fetchProfileData(userId);
    console.log('Profile data fetched successfully');
    
    const resumeHTML = createResumeHTML(profileData);
    console.log('Resume HTML created');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = profileData.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `resume_${safeName}_${timestamp}.pdf`;
    
    console.log('Generating PDF...');
    const pdfBlob = await generatePDFFromHTML(resumeHTML, fileName);
    console.log('PDF generated successfully');
    
    console.log('Uploading to storage...');
    const { publicUrl, filePath } = await uploadPdfToStorage(pdfBlob, fileName, profileData.user_id);
    console.log('PDF uploaded successfully');
    
    // Update profile with resume URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        resume_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', profileData.user_id);
    
    if (updateError) {
      console.warn('Failed to update profile with resume URL:', updateError);
    }
    
    return `/resume : ${publicUrl}`;
    
  } catch (error) {
    console.error('Resume generation error:', error);
    return `/resume : Error - ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
}

// Helper functions
export function downloadPDF(pdfBlob: Blob, fileName: string): void {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function previewResumeHTML(userId?: string): void {
  fetchProfileData(userId).then(profileData => {
    const html = createResumeHTML(profileData);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Resume Preview - ${profileData.name}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: 'Times New Roman', serif; 
                background: #f5f5f5; 
              }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  }).catch(console.error);
}

export async function generateAndDownloadResume(userId?: string): Promise<string> {
  try {
    const result = await generateResume(userId);
    return result;
  } catch (error) {
    return `/resume : Error - ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
}

// Global type declarations
declare global {
  interface Window {
    jsPDF: any;
    jspdf: any;
    html2canvas: any;
  }
}

const ResumeGenerator = {
  generateResume,
  generateAndDownloadResume,
  downloadPDF,
  previewResumeHTML
};

export default ResumeGenerator;