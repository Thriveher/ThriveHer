export interface LearningTopic {
    id: string;
    title: string;
    description: string;
    icon: string;
    progress: number;
    bgColor?: string;
  }
  
  export const learningTopics: LearningTopic[] = [
    {
      id: 'css',
      title: 'CSS',
      description: 'Styling and layout techniques',
      icon: '🎨',
      progress: 65,
      bgColor: '#8BA889'
    },
    {
      id: 'graphic-design',
      title: 'Graphic Design',
      description: 'Visual composition and design principles',
      icon: '✏️',
      progress: 42,
      bgColor: '#49654E'
    },
    {
      id: 'react',
      title: 'React',
      description: 'Component-based UI development',
      icon: '⚛️',
      progress: 78,
      bgColor: '#253528'
    },
    {
      id: 'ui-ux',
      title: 'UI/UX Design',
      description: 'User interface and experience design',
      icon: '📱',
      progress: 35,
      bgColor: '#8BA889'
    },
    {
      id: 'typescript',
      title: 'TypeScript',
      description: 'Strongly typed JavaScript development',
      icon: '📝',
      progress: 50,
      bgColor: '#49654E'
    },
    {
      id: 'animation',
      title: 'Animation',
      description: 'Creating engaging motion and transitions',
      icon: '🎬',
      progress: 25,
      bgColor: '#253528'
    },
    {
      id: 'responsive',
      title: 'Responsive Design',
      description: 'Cross-platform layout techniques',
      icon: '📊',
      progress: 60,
      bgColor: '#8BA889'
    }
  ];