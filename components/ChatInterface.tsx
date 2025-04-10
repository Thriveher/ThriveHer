import { useState, useRef, useEffect } from 'react';

interface ChatInterfaceProps {
  messages: Array<{text: string, sender: 'user' | 'bot'}>;
  onSubmit: (message: string) => void;
  onClose: () => void;
}

export default function ChatInterface({ messages, onSubmit, onClose }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSubmit(newMessage);
      setNewMessage('');
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 max-h-96 flex flex-col"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="flex justify-between items-center p-3 border-b" style={{ borderColor: '#49654E' }}>
        <h3 className="font-semibold" style={{ color: '#253528' }}>Job Assistant</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-md"
          style={{ backgroundColor: '#253528', color: '#FFFFFF' }}
        >
          Minimize
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: '300px' }}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`mb-3 max-w-3/4 p-3 rounded-lg ${
              msg.sender === 'user' 
                ? 'ml-auto' 
                : 'mr-auto'
            }`}
            style={{ 
              backgroundColor: msg.sender === 'user' ? '#253528' : '#49654E',
              color: '#FFFFFF'
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-3 border-t flex" style={{ borderColor: '#49654E' }}>
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-2 rounded-l-md outline-none"
          style={{ borderColor: '#49654E', color: '#253528' }}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-r-md"
          style={{ backgroundColor: '#253528', color: '#FFFFFF' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}