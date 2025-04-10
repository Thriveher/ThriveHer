"use client";

import { useState } from 'react';
import Navbar from '@/components/NavBar';
import JobSelector from '@/components/JobSelector';
import JobListings from '@/components/JobListings';
import ChatBar from '@/components/ChatBar';
import ChatInterface from '@/components/ChatInterface';

export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{text: string, sender: 'user' | 'bot'}>>([]);
  const [showJobSelector, setShowJobSelector] = useState<boolean>(true);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  
  const handleJobSelect = (job: string) => {
    setSelectedJob(job);
    setShowJobSelector(false);
  };
  
  const handleJobSelectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJob) {
      setShowJobSelector(false);
    }
  };
  
  const handleChatSubmit = (message: string) => {
    setChatMessages([...chatMessages, {text: message, sender: 'user'}]);
    // Simulate response (in a real app, you'd call an API)
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        text: `Here's some information about ${selectedJob} positions.`,
        sender: 'bot'
      }]);
    }, 1000);
    setIsChatOpen(true);
  };
  
  const closeChat = () => {
    setIsChatOpen(false);
  };
  
  const resetJobSelection = () => {
    setShowJobSelector(true);
    setSelectedJob(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#8BA889' }}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {showJobSelector ? (
          <div 
            className="mb-6 rounded-lg shadow-lg bg-white p-6 transition-all duration-300"
            style={{ 
              transform: isHovering ? 'translateY(-5px)' : 'translateY(0)',
              boxShadow: isHovering ? '0 10px 25px rgba(0,0,0,0.1)' : '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Select a Job Position</h2>
            <form onSubmit={handleJobSelectorSubmit}>
              <JobSelector onSelect={handleJobSelect} />
              <button 
                type="submit" 
                className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
                disabled={!selectedJob}
              >
                Continue
              </button>
            </form>
          </div>
        ) : (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              {selectedJob} Positions
            </h2>
            <button 
              onClick={resetJobSelection}
              className="bg-white text-green-700 hover:bg-gray-100 font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Change Position
            </button>
          </div>
        )}
        
        {selectedJob && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6 animate-fadeIn">
            <JobListings selectedJob={selectedJob} />
          </div>
        )}
        
        {isChatOpen ? (
          <div className="fixed bottom-0 right-0 mb-4 mr-4 w-96 animate-slideUp">
            <ChatInterface 
              messages={chatMessages}
              onSubmit={handleChatSubmit}
              onClose={closeChat}
            />
          </div>
        ) : (
          <div className="fixed bottom-0 right-0 mb-4 mr-4 animate-fadeIn">
            <ChatBar onSubmit={handleChatSubmit} />
          </div>
        )}
      </main>
    </div>
  );
}