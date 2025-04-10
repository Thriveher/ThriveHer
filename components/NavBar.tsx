export default function Navbar() {
    return (
      <nav className="w-full py-4 px-6" style={{ backgroundColor: '#49654E' }}>
        <div className="container mx-auto flex items-center">
          <div className="font-bold text-lg" style={{ color: '#FFFFFF' }}>
            JobFinder
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <button 
              className="text-sm py-1 px-3 rounded-md" 
              style={{ backgroundColor: '#253528', color: '#FFFFFF' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>
    );
  }