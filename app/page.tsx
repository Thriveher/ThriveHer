import React from 'react';
import { Search, User, MessageSquare, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#253528] font-sans">
      {/* Navigation */}
      <nav className="bg-white py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-bold text-xl text-[#253528]">Thrive<span className="text-[#49654E]">Her</span></span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-[#253528] hover:text-[#49654E]">Features</a>
            <a href="#how-it-works" className="text-[#253528] hover:text-[#49654E]">How It Works</a>
          </div>
          <div>
            <button className="bg-[#49654E] text-white px-5 py-2 rounded-md hover:bg-[#253528] transition duration-300">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-[#253528] leading-tight">
              Find Your Perfect Job with AI-Powered Search
            </h1>
            <p className="text-lg mb-8 text-[#253528] opacity-80">
              ThriveHer brings together job listings personalized for your career growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-[#49654E] text-white px-6 py-3 rounded-md hover:bg-[#253528] transition duration-300 flex items-center justify-center gap-2">
                Try Now <ArrowRight size={18} />
              </button>
              <button className="border border-[#49654E] text-[#49654E] px-6 py-3 rounded-md hover:bg-[#8BA889] hover:text-white transition duration-300">
                Learn More
              </button>
            </div>
          </div>
          <div className="relative">
            <img 
              src="/api/placeholder/600/400" 
              alt="ThriveHer dashboard" 
              className="rounded-lg shadow-md z-10 relative" 
            />
            <div className="absolute -bottom-3 -right-3 bg-[#8BA889] w-full h-full rounded-lg -z-10"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#f5f7f5]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-[#253528]">Why Choose ThriveHer</h2>
            <p className="text-lg max-w-2xl mx-auto text-[#253528] opacity-80">
              Our intelligent platform streamlines your job search process.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm transition-all hover:shadow-md">
              <div className="bg-[#f0f5f0] p-3 inline-block rounded-lg mb-4">
                <Search size={24} className="text-[#49654E]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#253528]">Unified Search</h3>
              <p className="text-[#253528] opacity-80">
                Search across multiple platforms from a single interface.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm transition-all hover:shadow-md">
              <div className="bg-[#f0f5f0] p-3 inline-block rounded-lg mb-4">
                <User size={24} className="text-[#49654E]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#253528]">Personalized Matches</h3>
              <p className="text-[#253528] opacity-80">
                AI tailors job recommendations based on your skills and goals.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm transition-all hover:shadow-md">
              <div className="bg-[#f0f5f0] p-3 inline-block rounded-lg mb-4">
                <MessageSquare size={24} className="text-[#49654E]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#253528]">Conversational Interface</h3>
              <p className="text-[#253528] opacity-80">
                Chat naturally to refine searches and get application advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-[#253528]">How ThriveHer Works</h2>
            <p className="text-lg max-w-2xl mx-auto text-[#253528] opacity-80">
              Finding your dream job has never been easier.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="space-y-12">
                <div className="flex gap-6">
                  <div className="bg-[#49654E] text-white h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-[#253528]">Start a Conversation</h3>
                    <p className="text-[#253528] opacity-80">
                      Tell ThriveHer what you're looking for in your next role.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="bg-[#49654E] text-white h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-[#253528]">Review Results</h3>
                    <p className="text-[#253528] opacity-80">
                      See personalized listings that match your preferences.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="bg-[#49654E] text-white h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-[#253528]">Apply with Confidence</h3>
                    <p className="text-[#253528] opacity-80">
                      Get insights and application tips all in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2 relative">
              <img 
                src="/api/placeholder/400/600" 
                alt="ThriveHer mobile interface" 
                className="rounded-lg mx-auto shadow-md z-10 relative"
              />
              <div className="absolute -bottom-3 -left-3 bg-[#8BA889] w-full h-full rounded-lg -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#253528] text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Job Search?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join professionals who've found their dream jobs with ThriveHer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#253528] px-6 py-3 rounded-md hover:bg-[#8BA889] hover:text-white transition duration-300 flex items-center justify-center gap-2 mx-auto sm:mx-0">
              Get Started <ArrowRight size={18} />
            </button>
            <button className="border border-white text-white px-6 py-3 rounded-md hover:bg-[#49654E] transition duration-300 mx-auto sm:mx-0">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#253528]">Thrive<span className="text-[#49654E]">Her</span></h3>
              <p className="text-[#253528] opacity-80 mb-4">
                AI-powered job search assistant for modern professionals.
              </p>
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
              <h4 className="font-medium mb-4 text-[#253528]">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Features</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Pricing</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4 text-[#253528]">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Blog</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Career Tips</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Success Stories</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4 text-[#253528]">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">About</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Contact</a></li>
                <li><a href="#" className="text-[#253528] opacity-80 hover:text-[#49654E]">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-8 pt-6 text-center text-[#253528] opacity-70 text-sm">
            <p>&copy; {new Date().getFullYear()} ThriveHer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}