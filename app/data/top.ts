// Path: src/data/topics.ts

export interface Topic {
    id: string;
    title: string;
    description: string;
    icon: string;
    bgColor: string;
    progress: number;
  }
  
  export const learningTopics: Topic[] = [
    {
      id: 'javascript',
      title: 'JavaScript',
      description: 'Modern JavaScript programming',
      icon: '📱',
      bgColor: '#F7DF1E',
      progress: 60,
    },
    {
      id: 'react',
      title: 'React',
      description: 'UI library for building interfaces',
      icon: '⚛️',
      bgColor: '#61DAFB',
      progress: 45,
    },
    {
      id: 'typescript',
      title: 'TypeScript',
      description: 'Typed JavaScript for better code',
      icon: '🔷',
      bgColor: '#3178C6',
      progress: 30,
    },
    {
      id: 'nodejs',
      title: 'Node.js',
      description: 'JavaScript runtime environment',
      icon: '🟩',
      bgColor: '#539E43',
      progress: 25,
    },
  ];
  
  export const getTopicById = (id: string): Topic | undefined => {
    return learningTopics.find(topic => topic.id === id);
  };