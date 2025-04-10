import { useState } from 'react';

interface JobSelectorProps {
  onSelect: (job: string) => void;
}

export default function JobSelector({ onSelect }: JobSelectorProps) {
  const jobs = [
    'Software Developer',
    'UX Designer',
    'Product Manager',
    'Data Analyst',
    'Marketing Specialist'
  ];
  
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  
  const handleSelect = (job: string) => {
    setSelectedJob(job);
    onSelect(job);
  };
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#253528' }}>
        Select a Job Category
      </h2>
      
      <div className="flex flex-wrap gap-3">
        {jobs.map((job) => (
          <button
            key={job}
            onClick={() => handleSelect(job)}
            className={`py-2 px-4 rounded-md transition-colors ${
              selectedJob === job 
                ? 'text-white' 
                : 'text-white hover:bg-opacity-90'
            }`}
            style={{ 
              backgroundColor: selectedJob === job ? '#253528' : '#49654E',
            }}
          >
            {job}
          </button>
        ))}
      </div>
    </div>
  );
}