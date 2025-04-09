import React from 'react';
import { Search, Briefcase, Globe, User, MessageSquare, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#253528] font-['Poppins',sans-serif]">
      {/* Navigation */}
      <nav className="bg-white py-4 px-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-[#253528]">Thrive<span className="text-[#49654E]">Her</span></span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-[#253528] hover:text-[#49654E] font-medium">Features</a>
            <a href="#how-it-works" className="text-[#253528] hover:text-[#49654E] font-medium">How It Works</a>
            <a href="#testimonials" className="text-[#253528] hover:text-[#49654E] font-medium">Testimonials</a>
          </div>
          <div>
            <button className="bg-[#49654E] text-white px-6 py-2 rounded-md font-medium hover:bg-[#253528] transition duration-300">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img 
            src="/api/placeholder/1920/1080" 
            alt="Background pattern" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#253528] leading-tight">
              Find Your Perfect Job with AI-Powered Search
            </h1>
            <p className="text-lg mb-8 text-[#253528] opacity-90">
              ThriveHer brings together job listings from LinkedIn and other platforms, 
              personalized for your career growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-[#49654E] text-white px-6 py-3 rounded-md font-medium hover:bg-[#253528] transition duration-300 flex items-center justify-center gap-2">
                Try ThriveHer Now <ArrowRight size={18} />
              </button>
              <button className="border-2 border-[#49654E] text-[#49654E] px-6 py-3 rounded-md font-medium hover:bg-[#8BA889] hover:border-[#8BA889] transition duration-300">
                Learn More
              </button>
            </div>
          </div>
          <div className="relative">
            <img 
              src="/api/placeholder/600/400" 
              alt="ThriveHer dashboard" 
              className="rounded-lg shadow-lg z-10 relative" 
            />
            <div className="absolute -bottom-4 -right-4 bg-[#8BA889] w-full h-full rounded-lg -z-10"></div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="py-12 bg-[#253528]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <img src="/api/placeholder/300/200" alt="Woman at computer" className="rounded-lg w-full h-40 object-cover" />
            <img src="/api/placeholder/300/200" alt="Team meeting" className="rounded-lg w-full h-40 object-cover" />
            <img src="/api/placeholder/300/200" alt="Person working remotely" className="rounded-lg w-full h-40 object-cover" />
            <img src="/api/placeholder/300/200" alt="Career growth" className="rounded-lg w-full h-40 object-cover" />
            <img src="/api/placeholder/300/200" alt="Modern office" className="rounded-lg w-full h-40 object-cover" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 relative bg-white">
        <div className="absolute top-0 right-0 h-64 w-64 bg-[#49654E] opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 h-48 w-48 bg-[#49654E] opacity-5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#253528]">Why Choose ThriveHer</h2>
            <p className="text-lg max-w-2xl mx-auto text-[#253528] opacity-90">
              Our intelligent platform streamlines your job search process with powerful features designed for success.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="bg-[#f0f5f0] p-3 inline-block rounded-lg mb-4">
                <Search size={24} className="text-[#49654E]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#253528]">Unified Search</h3>
              <p className="text-[#253528] opacity-80 mb-6">
                Search across LinkedIn, Indeed, Glassdoor, and other platforms from a single interface.
              </p>
              <img 
                src="/api/placeholder/400/240" 
                alt="Unified search interface" 
                className="rounded-lg w-full h-48 object-cover shadow-sm" 
              />
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="bg-[#f0f5f0] p-3 inline-block rounded-lg mb-4">
                <User size={24} className="text-[#49654E]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#253528]">Personalized Matches</h3>
              <p className="text-[#253528] opacity-80 mb-6">
                AI tailors job recommendations based on your skills, experience, and career goals.
              </p>
              <img 
                src="/api/placeholder/400/240" 
                alt="Personalized job matches" 
                className="rounded-lg w-full h-48 object-cover shadow-sm" 
              />
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="bg-[#f0f5f0] p-3 inline-block rounded-lg mb-4">
                <MessageSquare size={24} className="text-[#49654E]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#253528]">Conversational Interface</h3>
              <p className="text-[#253528] opacity-80 mb-6">
                Chat naturally with our platform to refine searches and get advice on applications.
              </p>
              <img 
                src="/api/placeholder/400/240" 
                alt="Chat interface" 
                className="rounded-lg w-full h-48 object-cover shadow-sm" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Image Showcase */}
      <section className="py-16 bg-[#f5f7f5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="aspect-square">
              <img 
                src="/api/placeholder/400/400" 
                alt="Career growth showcase" 
                className="rounded-lg w-full h-full object-cover shadow-sm" 
              />
            </div>
            <div className="aspect-square md:row-span-2">
              <img 
                src="/api/placeholder/400/800" 
                alt="Professional development" 
                className="rounded-lg w-full h-full object-cover shadow-sm" 
              />
            </div>
            <div className="aspect-square">
              <img 
                src="/api/placeholder/400/400" 
                alt="Job interview" 
                className="rounded-lg w-full h-full object-cover shadow-sm" 
              />
            </div>
            <div className="aspect-square md:row-span-2">
              <img 
                src="/api/placeholder/400/800" 
                alt="Workplace diversity" 
                className="rounded-lg w-full h-full object-cover shadow-sm" 
              />
            </div>
            <div className="aspect-square md:col-span-2">
              <img 
                src="/api/placeholder/800/400" 
                alt="Team collaboration" 
                className="rounded-lg w-full h-full object-cover shadow-sm" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#253528]">How ThriveHer Works</h2>
            <p className="text-lg max-w-2xl mx-auto text-[#253528] opacity-90">
              Finding your dream job has never been easier with our intelligent job search assistant.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="space-y-12">
                <div className="flex gap-6">
                  <div className="bg-[#49654E] text-white h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-[#253528]">Start a Conversation</h3>
                    <p className="text-[#253528] opacity-80 mb-4">
                      Tell ThriveHer what you're looking for in your next role – skills, location, industry, or company size.
                    </p>
                    <img 
                      src="/api/placeholder/400/200" 
                      alt="Conversation starter" 
                      className="rounded-lg shadow-sm" 
                    />
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="bg-[#49654E] text-white h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-[#253528]">Review Personalized Results</h3>
                    <p className="text-[#253528] opacity-80 mb-4">
                      ThriveHer aggregates listings from multiple platforms, highlighting those that match your preferences.
                    </p>
                    <img 
                      src="/api/placeholder/400/200" 
                      alt="Job results" 
                      className="rounded-lg shadow-sm" 
                    />
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="bg-[#49654E] text-white h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-[#253528]">Apply with Confidence</h3>
                    <p className="text-[#253528] opacity-80 mb-4">
                      Get insights about companies, application tips, and direct links to apply all in one place.
                    </p>
                    <img 
                      src="/api/placeholder/400/200" 
                      alt="Application process" 
                      className="rounded-lg shadow-sm" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2 relative">
              <img 
                src="/api/placeholder/500/700" 
                alt="ThriveHer mobile interface" 
                className="rounded-lg mx-auto shadow-lg z-10 relative"
              />
              <div className="absolute -bottom-4 -left-4 bg-[#8BA889] w-full h-full rounded-lg -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-[#49654E] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold mb-2">10k+</h3>
              <p>Active Users</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">85%</h3>
              <p>Success Rate</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">50+</h3>
              <p>Job Platforms</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">24/7</h3>
              <p>Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured On Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xl font-medium text-center mb-8 text-[#253528] opacity-70">Featured In</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
            <img src="/api/placeholder/120/60" alt="Tech News logo" className="h-12 object-contain mx-auto grayscale hover:grayscale-0 transition-all" />
            <img src="/api/placeholder/120/60" alt="Career Magazine logo" className="h-12 object-contain mx-auto grayscale hover:grayscale-0 transition-all" />
            <img src="/api/placeholder/120/60" alt="Startup Weekly logo" className="h-12 object-contain mx-auto grayscale hover:grayscale-0 transition-all" />
            <img src="/api/placeholder/120/60" alt="Business Journal logo" className="h-12 object-contain mx-auto grayscale hover:grayscale-0 transition-all" />
            <img src="/api/placeholder/120/60" alt="Tech Insider logo" className="h-12 object-contain mx-auto grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-[#253528] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <img 
            src="/api/placeholder/1920/1080" 
            alt="Background pattern" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Job Search?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of professionals who've found their dream jobs with ThriveHer's AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#253528] px-6 py-3 rounded-md font-medium hover:bg-[#8BA889] transition duration-300 flex items-center justify-center gap-2 mx-auto sm:mx-0">
              Get Started Now <ArrowRight size={18} />
            </button>
            <button className="border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-[#49654E] hover:border-[#49654E] transition duration-300 mx-auto sm:mx-0">
              Schedule a Demo
            </button>
          </div>
          <div className="mt-12 flex justify-center items-center gap-8 flex-wrap">
            <img src="/api/placeholder/120/40" alt="LinkedIn logo" className="h-10" />
            <img src="/api/placeholder/120/40" alt="Indeed logo" className="h-10" />
            <img src="/api/placeholder/120/40" alt="Glassdoor logo" className="h-10" />
            <img src="/api/placeholder/120/40" alt="ZipRecruiter logo" className="h-10" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4 text-[#253528]">Thrive<span className="text-[#49654E]">Her</span></h3>
              <p className="text-[#253528] opacity-80 mb-4">
                AI-powered job search assistant for modern professionals.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <img src="/api/placeholder/200/120" alt="ThriveHer interface 1" className="rounded-lg w-full h-24 object-cover" />
                <img src="/api/placeholder/200/120" alt="ThriveHer interface 2" className="rounded-lg w-full h-24 object-cover" />
              </div>
              <div className="flex space-x-4">
                <a href="#" className="text-[#49654E] hover:text-[#253528]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
                <a href="#" className="text-[#49654E] hover:text-[#253528]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753c0-.249 1.51-2.772 1.818-4.013z"></path></svg>
                </a>
                <a href="#" className="text-[#49654E] hover:text-[#253528]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-[#253528]">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Features</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Pricing</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">API</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Integrations</a></li>
              </ul>
              <img 
                src="/api/placeholder/240/160" 
                alt="Product features" 
                className="rounded-lg mt-6 w-full object-cover" 
              />
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-[#253528]">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Blog</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Career Tips</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Industry Insights</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Success Stories</a></li>
              </ul>
              <img 
                src="/api/placeholder/240/160" 
                alt="Career resources" 
                className="rounded-lg mt-6 w-full object-cover" 
              />
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-[#253528]">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">About Us</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Contact</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Privacy Policy</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Terms of Service</a></li>
              </ul>
              <img 
                src="/api/placeholder/240/160" 
                alt="Company team" 
                className="rounded-lg mt-6 w-full object-cover" 
              />
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-12 pt-8 text-center text-[#253528] opacity-80">
            <p>&copy; {new Date().getFullYear()} ThriveHer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}