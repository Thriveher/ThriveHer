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
  issuer: string;
}

interface ProfileData {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  profile_photo?: string;
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
              issuer: parsed.issuer || ''
            };
          }
        } catch (e) {
          if (cert.trim() !== '') {
            return {
              name: cert.trim(),
              issuer: ''
            };
          }
        }
      } else if (cert && typeof cert === 'object' && cert.name && cert.name.trim() !== '') {
        return {
          name: cert.name.trim(),
          issuer: cert.issuer || ''
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
    return `${start} – ${end}`;
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
  padding: 0.75in;
  margin: 0 auto;
  background: white;
  font-family: 'Times New Roman', Times, serif;
  font-size: 11pt;
  line-height: 1.15;
  color: #000000;
  box-sizing: border-box;
">
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 24pt; border-bottom: 1pt solid #000000; padding-bottom: 12pt;">
    <h1 style="
      font-size: 18pt;
      font-weight: bold;
      margin: 0 0 6pt 0;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 2pt;
    ">${profileData.name}</h1>
    <div style="
      font-size: 10pt;
      color: #000000;
      line-height: 1.2;
      margin-top: 8pt;
    ">
      ${profileData.phone ? `${profileData.phone}` : ''}${profileData.phone && profileData.email ? ' | ' : ''}${profileData.email}
      ${(profileData.phone || profileData.email) && profileData.location ? ' | ' : ''}${profileData.location || ''}
      <br>
      ${profileData.linkedin || profileData.github || profileData.portfolio ? `
        ${profileData.linkedin || ''}${profileData.linkedin && (profileData.github || profileData.portfolio) ? ' | ' : ''}${profileData.github || ''}${profileData.github && profileData.portfolio ? ' | ' : ''}${profileData.portfolio || ''}
      ` : ''}
    </div>
  </div>

  ${profileData.summary && profileData.summary.trim() ? `
  <!-- Professional Summary -->
  <div style="margin-bottom: 18pt;">
    <h2 style="
      font-size: 12pt;
      font-weight: bold;
      color: #000000;
      margin: 0 0 8pt 0;
      text-transform: uppercase;
      letter-spacing: 1pt;
      border-bottom: 0.5pt solid #000000;
      padding-bottom: 2pt;
    ">PROFESSIONAL SUMMARY</h2>
    <p style="
      margin: 0;
      text-align: justify;
      line-height: 1.15;
      text-indent: 0;
    ">${profileData.summary}</p>
  </div>
  ` : ''}

  ${profileData.experience && profileData.experience.length > 0 ? `
  <!-- Professional Experience -->
  <div style="margin-bottom: 18pt;">
    <h2 style="
      font-size: 12pt;
      font-weight: bold;
      color: #000000;
      margin: 0 0 12pt 0;
      text-transform: uppercase;
      letter-spacing: 1pt;
      border-bottom: 0.5pt solid #000000;
      padding-bottom: 2pt;
    ">PROFESSIONAL EXPERIENCE</h2>
    ${profileData.experience.map(exp => `
    <div style="margin-bottom: 16pt; page-break-inside: avoid;">
      <div style="
        display: table;
        width: 100%;
        margin-bottom: 4pt;
      ">
        <div style="display: table-row;">
          <div style="display: table-cell; width: 75%; vertical-align: top;">
            <div style="
              font-size: 11pt;
              font-weight: bold;
              margin: 0;
              color: #000000;
            ">${exp.position}</div>
            <div style="
              font-size: 11pt;
              color: #000000;
              font-style: italic;
              margin-top: 2pt;
            ">${exp.company}${exp.location ? `, ${exp.location}` : ''}</div>
          </div>
          <div style="display: table-cell; width: 25%; text-align: right; vertical-align: top;">
            <div style="
              font-size: 11pt;
              color: #000000;
              white-space: nowrap;
            ">${formatDateRange(exp.start_date, exp.end_date)}</div>
          </div>
        </div>
      </div>
      ${exp.description || (exp.key_projects && exp.key_projects.length > 0) || (exp.achievements && exp.achievements.length > 0) ? `
      <ul style="margin: 4pt 0 0 18pt; padding: 0; list-style-type: disc;">
        ${exp.description ? exp.description.split('.').filter(s => s.trim() && s.trim().length > 5).map(desc => `
          <li style="margin-bottom: 3pt; line-height: 1.15;">${desc.trim()}${desc.trim().endsWith('.') ? '' : '.'}</li>
        `).join('') : ''}
        ${exp.key_projects && exp.key_projects.length > 0 && exp.key_projects.some(p => p.trim()) ? `
          <li style="margin-bottom: 3pt; line-height: 1.15;"><strong>Key Projects:</strong> ${exp.key_projects.filter(p => p.trim()).join(', ')}.</li>
        ` : ''}
        ${exp.achievements && exp.achievements.length > 0 && exp.achievements.some(a => a.trim()) ? `
          <li style="margin-bottom: 3pt; line-height: 1.15;"><strong>Key Achievements:</strong> ${exp.achievements.filter(a => a.trim()).join('; ')}.</li>
        ` : ''}
      </ul>
      ` : ''}
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${profileData.education && profileData.education.length > 0 ? `
  <!-- Education -->
  <div style="margin-bottom: 18pt;">
    <h2 style="
      font-size: 12pt;
      font-weight: bold;
      color: #000000;
      margin: 0 0 12pt 0;
      text-transform: uppercase;
      letter-spacing: 1pt;
      border-bottom: 0.5pt solid #000000;
      padding-bottom: 2pt;
    ">EDUCATION</h2>
    ${profileData.education.map(edu => `
    <div style="margin-bottom: 12pt; page-break-inside: avoid;">
      <div style="
        display: table;
        width: 100%;
        margin-bottom: 4pt;
      ">
        <div style="display: table-row;">
          <div style="display: table-cell; width: 75%; vertical-align: top;">
            <div style="
              font-size: 11pt;
              font-weight: bold;
              margin: 0;
              color: #000000;
            ">${edu.degree}${edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</div>
            <div style="
              font-size: 11pt;
              color: #000000;
              font-style: italic;
              margin-top: 2pt;
            ">${edu.institution}${edu.location ? `, ${edu.location}` : ''}</div>
          </div>
          <div style="display: table-cell; width: 25%; text-align: right; vertical-align: top;">
            <div style="
              font-size: 11pt;
              color: #000000;
              white-space: nowrap;
            ">${formatDateRange(edu.start_date, edu.end_date)}</div>
          </div>
        </div>
      </div>
      ${edu.description || (edu.projects && edu.projects.length > 0) || (edu.relevant_coursework && edu.relevant_coursework.length > 0) ? `
      <div style="margin-top: 4pt;">
        ${edu.description ? `<div style="margin-bottom: 4pt; line-height: 1.15;">${edu.description}</div>` : ''}
        ${edu.projects && edu.projects.length > 0 && edu.projects.some(p => p.trim()) ? `
          <div style="margin-bottom: 4pt; line-height: 1.15;"><strong>Notable Projects:</strong> ${edu.projects.filter(p => p.trim()).join(', ')}.</div>
        ` : ''}
        ${edu.relevant_coursework && edu.relevant_coursework.length > 0 && edu.relevant_coursework.some(c => c.trim()) ? `
          <div style="margin-bottom: 4pt; line-height: 1.15;"><strong>Relevant Coursework:</strong> ${edu.relevant_coursework.filter(c => c.trim()).join(', ')}.</div>
        ` : ''}
      </div>
      ` : ''}
    </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Skills and Additional Information -->
  <div style="
    display: table;
    width: 100%;
    margin-top: 12pt;
  ">
    <div style="display: table-row;">
      <div style="display: table-cell; width: 50%; vertical-align: top; padding-right: 24pt;">
        ${profileData.skills && profileData.skills.length > 0 ? `
        <div style="margin-bottom: 16pt;">
          <h3 style="
            font-size: 12pt;
            font-weight: bold;
            color: #000000;
            margin: 0 0 8pt 0;
            text-transform: uppercase;
            letter-spacing: 1pt;
            border-bottom: 0.5pt solid #000000;
            padding-bottom: 2pt;
          ">TECHNICAL SKILLS</h3>
          <div style="line-height: 1.3;">
            ${profileData.skills.filter(skill => skill.trim()).join(' • ')}
          </div>
        </div>
        ` : ''}

        ${profileData.languages && profileData.languages.length > 0 ? `
        <div style="margin-bottom: 16pt;">
          <h3 style="
            font-size: 12pt;
            font-weight: bold;
            color: #000000;
            margin: 0 0 8pt 0;
            text-transform: uppercase;
            letter-spacing: 1pt;
            border-bottom: 0.5pt solid #000000;
            padding-bottom: 2pt;
          ">LANGUAGES</h3>
          <div style="line-height: 1.3;">
            ${profileData.languages.filter(lang => lang.trim()).join(' • ')}
          </div>
        </div>
        ` : ''}
      </div>

      <div style="display: table-cell; width: 50%; vertical-align: top;">
        ${certifications.length > 0 ? `
        <div style="margin-bottom: 16pt;">
          <h3 style="
            font-size: 12pt;
            font-weight: bold;
            color: #000000;
            margin: 0 0 8pt 0;
            text-transform: uppercase;
            letter-spacing: 1pt;
            border-bottom: 0.5pt solid #000000;
            padding-bottom: 2pt;
          ">CERTIFICATIONS</h3>
          <div style="line-height: 1.3;">
            ${certifications.map(cert => 
              `${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''}`
            ).join(' • ')}
          </div>
        </div>
        ` : ''}

        ${profileData.interests && profileData.interests.length > 0 ? `
        <div style="margin-bottom: 16pt;">
          <h3 style="
            font-size: 12pt;
            font-weight: bold;
            color: #000000;
            margin: 0 0 8pt 0;
            text-transform: uppercase;
            letter-spacing: 1pt;
            border-bottom: 0.5pt solid #000000;
            padding-bottom: 2pt;
          ">INTERESTS</h3>
          <div style="line-height: 1.3;">
            ${profileData.interests.filter(interest => interest.trim()).join(' • ')}
          </div>
        </div>
        ` : ''}

        ${profileData.strengths && profileData.strengths.length > 0 ? `
        <div style="margin-bottom: 16pt;">
          <h3 style="
            font-size: 12pt;
            font-weight: bold;
            color: #000000;
            margin: 0 0 8pt 0;
            text-transform: uppercase;
            letter-spacing: 1pt;
            border-bottom: 0.5pt solid #000000;
            padding-bottom: 2pt;
          ">KEY STRENGTHS</h3>
          <div style="line-height: 1.3;">
            ${profileData.strengths.filter(strength => strength.trim()).join(' • ')}
          </div>
        </div>
        ` : ''}
      </div>
    </div>
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
      width: element.scrollWidth,
      height: element.scrollHeight,
      logging: false
    });

    const imgWidth = 210;
    const pageHeight = 297;
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
    const profileData = await fetchProfileData(userId);
    const resumeHTML = createResumeHTML(profileData);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = profileData.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `resume_${safeName}_${timestamp}.pdf`;
    
    const pdfBlob = await generatePDFFromHTML(resumeHTML, fileName);
    const { publicUrl, filePath } = await uploadPdfToStorage(pdfBlob, fileName, profileData.user_id);
    
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
              body { margin: 0; padding: 20px; font-family: 'Times New Roman', Times, serif; background: #f5f5f5; }
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