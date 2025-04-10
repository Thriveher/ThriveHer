interface JobListingsProps {
    selectedJob: string;
  }
  
  interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    description: string;
  }
  
  export default function JobListings({ selectedJob }: JobListingsProps) {
    // In a real app, you would fetch this data based on the selected job
    const jobs: Job[] = [
      {
        id: 1,
        title: `Senior ${selectedJob}`,
        company: 'TechCorp Inc.',
        location: 'New York, NY',
        salary: '$120,000 - $150,000',
        description: `We're looking for an experienced ${selectedJob} to join our growing team.`
      },
      {
        id: 2,
        title: `Junior ${selectedJob}`,
        company: 'StartupLabs',
        location: 'Remote',
        salary: '$80,000 - $95,000',
        description: `Great opportunity for a ${selectedJob} to grow with our company.`
      },
      {
        id: 3,
        title: `${selectedJob} Team Lead`,
        company: 'Enterprise Solutions',
        location: 'San Francisco, CA',
        salary: '$140,000 - $170,000',
        description: `Lead a team of talented ${selectedJob}s on cutting-edge projects.`
      }
    ];
    
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#FFFFFF' }}>
          {selectedJob} Positions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold" style={{ color: '#253528' }}>
                {job.title}
              </h3>
              <p className="text-sm font-medium mt-1" style={{ color: '#49654E' }}>
                {job.company} • {job.location}
              </p>
              <p className="mt-2 text-sm" style={{ color: '#253528' }}>
                {job.salary}
              </p>
              <p className="mt-3 text-sm" style={{ color: '#253528' }}>
                {job.description}
              </p>
              <button 
                className="mt-4 py-2 px-4 text-sm rounded-md w-full" 
                style={{ backgroundColor: '#253528', color: '#FFFFFF' }}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }