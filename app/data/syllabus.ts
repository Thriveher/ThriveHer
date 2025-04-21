// Define interfaces for syllabus data structure
export interface Lesson {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  content?: string; // Optional content field for lesson material
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface SyllabusItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  icon: string;
  bgColor: string;
  lessons: Lesson[];
}

export interface SyllabusData {
  title: string;
  description: string;
  items: SyllabusItem[];
}

// Data structure to hold all syllabi
const syllabusData: Record<string, SyllabusData> = {
  'css': {
    title: 'CSS Mastery',
    description: 'Master modern CSS techniques for beautiful websites',
    items: [
      {
        id: 'css-basics',
        title: 'CSS Fundamentals',
        description: 'Core concepts and selectors',
        progress: 100,
        icon: '📚',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'css-basics-1',
            title: 'Selectors and Properties',
            description: 'Learn the foundational elements of CSS',
            completed: true
          },
          {
            id: 'css-basics-2',
            title: 'Box Model and Layout',
            description: 'Understanding how elements are sized and positioned',
            completed: true
          }
        ]
      },
      {
        id: 'css-layout',
        title: 'Advanced Layouts',
        description: 'Flexbox and Grid techniques',
        progress: 75,
        icon: '🧩',
        bgColor: '#49654E',
        lessons: [
          {
            id: 'css-layout-1',
            title: 'Flexbox Fundamentals',
            description: 'Modern one-dimensional layouts',
            completed: true
          },
          {
            id: 'css-layout-2',
            title: 'CSS Grid Systems',
            description: 'Two-dimensional layout power',
            completed: false
          }
        ]
      },
      {
        id: 'css-animations',
        title: 'CSS Animations',
        description: 'Creating engaging motion effects',
        progress: 0,
        icon: '✨',
        bgColor: '#253528',
        lessons: [
          {
            id: 'css-anim-1',
            title: 'Transitions',
            description: 'Simple state-change animations',
            completed: false
          },
          {
            id: 'css-anim-2',
            title: 'Keyframe Animations',
            description: 'Complex multi-step animations',
            completed: false
          }
        ]
      },
      {
        id: 'css-architecture',
        title: 'CSS Architecture',
        description: 'Organizing CSS for large projects',
        progress: 0,
        icon: '🏗️',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'css-arch-1',
            title: 'BEM Methodology',
            description: 'Block Element Modifier approach',
            completed: false
          },
          {
            id: 'css-arch-2',
            title: 'CSS-in-JS Solutions',
            description: 'Modern component-based styling',
            completed: false
          }
        ]
      }
    ]
  },
  'graphic-design': {
    title: 'Graphic Design Principles',
    description: 'Learn to create beautiful visual compositions',
    items: [
      {
        id: 'design-fundamentals',
        title: 'Design Fundamentals',
        description: 'Core principles of visual design',
        progress: 100,
        icon: '🎭',
        bgColor: '#49654E',
        lessons: [
          {
            id: 'design-fund-1',
            title: 'Color Theory',
            description: 'Understanding color relationships',
            completed: true
          },
          {
            id: 'design-fund-2',
            title: 'Typography Basics',
            description: 'Selecting and pairing typefaces',
            completed: true
          }
        ]
      },
      {
        id: 'graphic-design-composition',
        title: 'Composition',
        description: 'Arranging visual elements effectively',
        progress: 50,
        icon: '📐',
        bgColor: '#253528',
        lessons: [
          {
            id: 'comp-1',
            title: 'Balance and Alignment',
            description: 'Creating harmonious layouts',
            completed: true
          },
          {
            id: 'comp-2',
            title: 'Visual Hierarchy',
            description: 'Guiding attention through design',
            completed: false
          }
        ]
      },
      {
        id: 'visual-identity',
        title: 'Visual Identity',
        description: 'Creating cohesive brand systems',
        progress: 0,
        icon: '🏷️',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'visual-id-1',
            title: 'Logo Design',
            description: 'Creating memorable brand marks',
            completed: false
          },
          {
            id: 'visual-id-2',
            title: 'Brand Guidelines',
            description: 'Establishing consistent visual language',
            completed: false
          }
        ]
      },
      {
        id: 'digital-tools',
        title: 'Digital Design Tools',
        description: 'Mastering industry-standard software',
        progress: 0,
        icon: '🖌️',
        bgColor: '#49654E',
        lessons: [
          {
            id: 'tools-1',
            title: 'Vector Graphics',
            description: 'Creating scalable illustrations',
            completed: false
          },
          {
            id: 'tools-2',
            title: 'Photo Editing',
            description: 'Enhancing and manipulating images',
            completed: false
          }
        ]
      }
    ]
  },
  'react': {
    title: 'React Development',
    description: 'Build powerful interactive user interfaces',
    items: [
      {
        id: 'react-basics',
        title: 'React Fundamentals',
        description: 'Core concepts and component model',
        progress: 100,
        icon: '⚛️',
        bgColor: '#253528',
        lessons: [
          {
            id: 'react-basics-1',
            title: 'JSX and Components',
            description: 'Building blocks of React applications',
            completed: true
          },
          {
            id: 'react-basics-2',
            title: 'Props and State',
            description: 'Managing data in React components',
            completed: true
          }
        ]
      },
      {
        id: 'react-hooks',
        title: 'React Hooks',
        description: 'Functional component patterns',
        progress: 100,
        icon: '🪝',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'hooks-1',
            title: 'useState and useEffect',
            description: 'Essential hooks for state and side effects',
            completed: true
          },
          {
            id: 'hooks-2',
            title: 'Custom Hooks',
            description: 'Creating reusable logic patterns',
            completed: true
          }
        ]
      },
      {
        id: 'react-state-management',
        title: 'State Management',
        description: 'Managing application data flow',
        progress: 50,
        icon: '📦',
        bgColor: '#49654E',
        lessons: [
          {
            id: 'state-1',
            title: 'Context API',
            description: 'Built-in state management tool',
            completed: true
          },
          {
            id: 'state-2',
            title: 'Redux Basics',
            description: 'Predictable state container',
            completed: false
          }
        ]
      },
      {
        id: 'react-perf',
        title: 'Performance Optimization',
        description: 'Creating efficient React applications',
        progress: 0,
        icon: '⚡',
        bgColor: '#253528',
        lessons: [
          {
            id: 'perf-1',
            title: 'Memoization',
            description: 'Preventing unnecessary rerenders',
            completed: false
          },
          {
            id: 'perf-2',
            title: 'Code Splitting',
            description: 'Loading components on demand',
            completed: false
          }
        ]
      }
    ]
  },
  'ui-ux': {
    title: 'UI/UX Design',
    description: 'Create intuitive and engaging user experiences',
    items: [
      {
        id: 'ux-research',
        title: 'UX Research',
        description: 'Understanding user needs',
        progress: 100,
        icon: '🔍',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'ux-research-1',
            title: 'User Interviews',
            description: 'Gathering qualitative insights',
            completed: true
          },
          {
            id: 'ux-research-2',
            title: 'Usability Testing',
            description: 'Evaluating interface effectiveness',
            completed: true
          }
        ]
      },
      {
        id: 'ui-fundamentals',
        title: 'UI Fundamentals',
        description: 'Visual interface design principles',
        progress: 0,
        icon: '🎨',
        bgColor: '#49654E',
        lessons: [
          {
            id: 'ui-fund-1',
            title: 'Interface Components',
            description: 'Common UI elements and patterns',
            completed: false
          },
          {
            id: 'ui-fund-2',
            title: 'Visual Hierarchy',
            description: 'Creating clear information structure',
            completed: false
          }
        ]
      },
      {
        id: 'wireframing',
        title: 'Wireframing & Prototyping',
        description: 'Creating interface blueprints',
        progress: 0,
        icon: '📝',
        bgColor: '#253528',
        lessons: [
          {
            id: 'wire-1',
            title: 'Low-Fidelity Wireframes',
            description: 'Quick interface sketching techniques',
            completed: false
          },
          {
            id: 'wire-2',
            title: 'Interactive Prototypes',
            description: 'Creating clickable mockups',
            completed: false
          }
        ]
      },
      {
        id: 'accessibility',
        title: 'Accessibility',
        description: 'Designing for all users',
        progress: 0,
        icon: '♿',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'access-1',
            title: 'Inclusive Design',
            description: 'Principles for universal usability',
            completed: false
          },
          {
            id: 'access-2',
            title: 'WCAG Guidelines',
            description: 'Technical accessibility standards',
            completed: false
          }
        ]
      }
    ]
  },
  'typescript': {
    title: 'TypeScript Development',
    description: 'Master strongly-typed JavaScript development',
    items: [
      {
        id: 'ts-basics',
        title: 'TypeScript Basics',
        description: 'Fundamental types and concepts',
        progress: 100,
        icon: '📝',
        bgColor: '#49654E',
        lessons: [
          {
            id: 'ts-basics-1',
            title: 'Basic Types',
            description: 'Understanding TypeScript type system',
            completed: true
          },
          {
            id: 'ts-basics-2',
            title: 'Interfaces & Type Aliases',
            description: 'Defining custom types',
            completed: true
          }
        ]
      },
      {
        id: 'ts-advanced',
        title: 'Advanced Types',
        description: 'Complex type patterns',
        progress: 50,
        icon: '🧩',
        bgColor: '#253528',
        lessons: [
          {
            id: 'ts-adv-1',
            title: 'Generics',
            description: 'Creating reusable typed components',
            completed: true
          },
          {
            id: 'ts-adv-2',
            title: 'Utility Types',
            description: 'Built-in type transformations',
            completed: false
          }
        ]
      },
      {
        id: 'ts-patterns',
        title: 'TypeScript Patterns',
        description: 'Common implementation strategies',
        progress: 0,
        icon: '📋',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'ts-pat-1',
            title: 'Factory Pattern',
            description: 'Creating objects with type safety',
            completed: false
          },
          {
            id: 'ts-pat-2',
            title: 'Module Augmentation',
            description: 'Extending existing types',
            completed: false
          }
        ]
      },
      {
        id: 'ts-migration',
        title: 'JavaScript to TypeScript',
        description: 'Migrating existing projects',
        progress: 0,
        icon: '🔄',
        bgColor: '#49654E',
        lessons: [
          {
            id: 'ts-mig-1',
            title: 'Incremental Migration',
            description: 'Adding TypeScript gradually',
            completed: false
          },
          {
            id: 'ts-mig-2',
            title: 'Type Declarations',
            description: 'Working with untyped libraries',
            completed: false
          }
        ]
      }
    ]
  },
  'animation': {
    title: 'Web Animation',
    description: 'Create engaging motion and interactions',
    items: [
      {
        id: 'anim-principles',
        title: 'Animation Principles',
        description: 'Fundamental concepts of motion',
        progress: 100,
        icon: '🎭',
        bgColor: '#253528',
        lessons: [
          {
            id: 'anim-prin-1',
            title: 'Timing and Spacing',
            description: 'Creating natural-feeling motion',
            completed: true
          },
          {
            id: 'anim-prin-2',
            title: 'Easing Functions',
            description: 'Controlling acceleration of animations',
            completed: true
          }
        ]
      },
      {
        id: 'css-animation',
        title: 'CSS Animation',
        description: 'Style-based animation techniques',
        progress: 0,
        icon: '🎨',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'css-anim-1',
            title: 'Transitions',
            description: 'Simple state change animations',
            completed: false
          },
          {
            id: 'css-anim-2',
            title: 'Keyframes',
            description: 'Multi-step animation sequences',
            completed: false
          }
        ]
      },
      {
        id: 'js-animation',
        title: 'JavaScript Animation',
        description: 'Programmatic animation control',
        progress: 0,
        icon: '⚙️',
        bgColor: '#49654E',
        lessons: [
          {
            id: 'js-anim-1',
            title: 'Animation Libraries',
            description: 'Using tools like GSAP and Framer Motion',
            completed: false
          },
          {
            id: 'js-anim-2',
            title: 'Canvas Animations',
            description: 'Creating complex visual animations',
            completed: false
          }
        ]
      },
      {
        id: 'microinteractions',
        title: 'Microinteractions',
        description: 'Small but meaningful animations',
        progress: 0,
        icon: '👆',
        bgColor: '#253528',
        lessons: [
          {
            id: 'micro-1',
            title: 'Form Feedback',
            description: 'Enhancing user input experiences',
            completed: false
          },
          {
            id: 'micro-2',
            title: 'State Changes',
            description: 'Animating UI element state transitions',
            completed: false
          }
        ]
      }
    ]
  },
  'responsive': {
    title: 'Responsive Web Design',
    description: 'Create websites that work on any device',
    items: [
      {
        id: 'responsive-fundamentals',
        title: 'Responsive Fundamentals',
        description: 'Core concepts of adaptable design',
        progress: 100,
        icon: '📱',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'resp-fund-1',
            title: 'Fluid Layouts',
            description: 'Using relative units for flexibility',
            completed: true
          },
          {
            id: 'resp-fund-2',
            title: 'Media Queries',
            description: 'Adapting layouts to different screens',
            completed: true
          }
        ]
      },
      {
        id: 'mobile-first',
        title: 'Mobile-First Approach',
        description: 'Designing for small screens first',
        progress: 50,
        icon: '📲',
        bgColor: '#49654E',
        lessons: [
          {
            id: 'mobile-1',
            title: 'Content Prioritization',
            description: 'Focusing on essential content',
            completed: true
          },
          {
            id: 'mobile-2',
            title: 'Progressive Enhancement',
            description: 'Adding features for larger screens',
            completed: false
          }
        ]
      },
      {
        id: 'responsive-images',
        title: 'Responsive Images',
        description: 'Optimizing visuals for all devices',
        progress: 0,
        icon: '🖼️',
        bgColor: '#253528',
        lessons: [
          {
            id: 'resp-img-1',
            title: 'Image Sizing Techniques',
            description: 'Controlling image dimensions responsively',
            completed: false
          },
          {
            id: 'resp-img-2',
            title: 'Art Direction',
            description: 'Serving different images for different contexts',
            completed: false
          }
        ]
      },
      {
        id: 'responsive-patterns',
        title: 'Responsive Design Patterns',
        description: 'Common layout solutions',
        progress: 0,
        icon: '📊',
        bgColor: '#8BA889',
        lessons: [
          {
            id: 'resp-pat-1',
            title: 'Navigation Patterns',
            description: 'Adapting menus to different screen sizes',
            completed: false
          },
          {
            id: 'resp-pat-2',
            title: 'Layout Transformations',
            description: 'Reorganizing content structures',
            completed: false
          }
        ]
      }
    ]
  }
};

// Function to get syllabus data by skill ID
export function getSyllabusBySkillId(skillId: string): SyllabusData {
  // Return the syllabus data for the requested skill
  // If the skill doesn't exist, return a default "not found" data structure
  return syllabusData[skillId] || {
    title: 'Skill Not Found',
    description: 'The requested skill could not be found.',
    items: []
  };
}

// Function to calculate total progress for a skill
export function calculateSkillProgress(skillId: string): number {
  const syllabus = syllabusData[skillId];
  
  if (!syllabus) return 0;
  
  // Calculate the average progress across all syllabus items
  const totalItems = syllabus.items.length;
  const totalProgress = syllabus.items.reduce((sum, item) => sum + item.progress, 0);
  
  return Math.round(totalProgress / totalItems);
}

// Function to update progress for a lesson
export function updateLessonProgress(
  skillId: string, 
  topicId: string, 
  lessonId: string, 
  completed: boolean
): boolean {
  const syllabus = syllabusData[skillId];
  if (!syllabus) return false;
  
  const topic = syllabus.items.find(item => item.id === topicId);
  if (!topic) return false;
  
  const lesson = topic.lessons.find(lesson => lesson.id === lessonId);
  if (!lesson) return false;
  
  // Update the lesson completion status
  lesson.completed = completed;
  
  // Recalculate topic progress
  const totalLessons = topic.lessons.length;
  const completedLessons = topic.lessons.filter(l => l.completed).length;
  topic.progress = Math.round((completedLessons / totalLessons) * 100);
  
  return true;
}