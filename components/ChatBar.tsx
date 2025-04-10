import { useState } from 'react';

interface ChatBarProps {
  onSubmit: (message: string) => void;
}

export default function ChatBar({ onSubmit }: ChatBarProps) {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message);
      setMessage('');
    }
  };
  
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center">
      <div 
        className="w-full max-w-2xl mx-4 rounded-full shadow-lg"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            placeholder="Ask about job opportunities..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 py-3 px-6 rounded-full outline-none"
            style={{ color: '#253528' }}
          />
          <button
            type="submit"
            className="m-1 py-2 px-4 rounded-full"
            style={{ backgroundColor: '#253528', color: '#FFFFFF' }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}