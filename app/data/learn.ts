import { Alert } from "react-native";

// Define types for our data structure
type InformationCard = {
  type: 'information';
  id: string;
  title: string;
  content: string;
  youtubeId?: string;
}

type QuestionCard = {
  type: 'question';
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

type CompletionCard = {
  type: 'completion';
  id: string;
  title: string;
  message: string;
}

type LessonCard = InformationCard | QuestionCard | CompletionCard;

type Lesson = {
  id: string;
  title: string;
  description: string;
  cards: LessonCard[];
}

// Mock database of lessons
const lessons: Record<string, Lesson> = {
  "css-layout": {
    id: "css-layout",
    title: "CSS Layout Fundamentals",
    description: "Learn the core concepts of CSS layout including box model, display properties, and positioning.",
    cards: [
      {
        type: "information",
        id: "css-layout-intro",
        title: "Introduction to CSS Layout",
        content: "CSS layout is how we arrange elements on a webpage. Understanding how elements are sized, positioned, and displayed is fundamental to creating responsive and well-structured web designs. In this lesson, we'll cover the box model, display properties, positioning, and modern layout techniques like Flexbox and Grid.",
        youtubeId: "yMEjLBKxlDU"
      },
      {
        type: "information",
        id: "css-box-model",
        title: "The CSS Box Model",
        content: "Every element in HTML is represented as a rectangular box. The CSS box model describes this rectangular box, and consists of: content, padding, border, and margin. Understanding the box model is crucial for controlling layout and spacing between elements.\n\nThe total width of an element = width + left padding + right padding + left border + right border + left margin + right margin\n\nYou can use the box-sizing property to change how the width and height of elements are calculated.",
        youtubeId: "rIO5326FgPE"
      },
      {
        type: "question",
        id: "box-model-question",
        question: "If an element has width: 300px, padding: 20px, border: 5px, and margin: 10px, what is the total width the element takes up in the document flow with the default box-sizing?",
        options: [
          {
            id: "a",
            text: "300px",
            isCorrect: false
          },
          {
            id: "b",
            text: "350px",
            isCorrect: false
          },
          {
            id: "c",
            text: "360px",
            isCorrect: true
          },
          {
            id: "d",
            text: "370px",
            isCorrect: false
          }
        ]
      },
      {
        type: "information",
        id: "display-properties",
        title: "Display Properties",
        content: "The display property specifies how an element is displayed in the layout. Common values include:\n\n• block: Takes up the full width available, with line breaks before and after\n• inline: Takes only as much width as needed, no line breaks\n• inline-block: Like inline but can have width and height\n• none: Removes the element from the document flow\n• flex: Creates a flex container\n• grid: Creates a grid container",
        youtubeId: "Qf-wVlVXR5I"
      },
      {
        type: "question",
        id: "display-question",
        question: "Which display property would you use to place elements side by side while still being able to set their width and height?",
        options: [
          {
            id: "a",
            text: "display: block",
            isCorrect: false
          },
          {
            id: "b",
            text: "display: inline",
            isCorrect: false
          },
          {
            id: "c",
            text: "display: inline-block",
            isCorrect: true
          },
          {
            id: "d",
            text: "display: none",
            isCorrect: false
          }
        ]
      },
      {
        type: "information",
        id: "positioning",
        title: "CSS Positioning",
        content: "Positioning allows you to move elements around the page. The position property can have these values:\n\n• static: Default, follows normal document flow\n• relative: Positioned relative to its normal position\n• absolute: Positioned relative to nearest positioned ancestor\n• fixed: Positioned relative to the viewport\n• sticky: A hybrid of relative and fixed positioning",
        youtubeId: "jx5jmI0UlXU"
      },
      {
        type: "question",
        id: "positioning-question",
        question: "Which positioning value would you use to make an element stay in the same position even when the user scrolls the page?",
        options: [
          {
            id: "a",
            text: "position: static",
            isCorrect: false
          },
          {
            id: "b",
            text: "position: relative",
            isCorrect: false
          },
          {
            id: "c",
            text: "position: absolute",
            isCorrect: false
          },
          {
            id: "d",
            text: "position: fixed",
            isCorrect: true
          }
        ]
      },
      {
        type: "information",
        id: "flexbox",
        title: "Flexbox Layout",
        content: "Flexbox is a one-dimensional layout model designed for laying out items in rows or columns. Key properties include:\n\n• display: flex - Creates a flex container\n• flex-direction - Sets the main axis (row, column)\n• justify-content - Aligns items along the main axis\n• align-items - Aligns items along the cross axis\n• flex-wrap - Controls whether items wrap to new lines\n• flex (on children) - Controls how items grow and shrink",
        youtubeId: "K74l26pE4YA"
      },
      {
        type: "question",
        id: "flexbox-question",
        question: "Which flexbox property would you use to center items horizontally in a flex container?",
        options: [
          {
            id: "a",
            text: "align-items: center",
            isCorrect: false
          },
          {
            id: "b",
            text: "justify-content: center",
            isCorrect: true
          },
          {
            id: "c",
            text: "flex-direction: center",
            isCorrect: false
          },
          {
            id: "d",
            text: "flex-wrap: center",
            isCorrect: false
          }
        ]
      },
      {
        type: "information",
        id: "grid-layout",
        title: "CSS Grid Layout",
        content: "CSS Grid is a two-dimensional layout system designed for laying out items in rows and columns simultaneously. Key properties include:\n\n• display: grid - Creates a grid container\n• grid-template-columns - Defines column tracks\n• grid-template-rows - Defines row tracks\n• grid-gap - Sets spacing between grid items\n• grid-column/grid-row - Places items in specific grid cells",
        youtubeId: "EiNiSFIPIQE"
      },
      {
        type: "question",
        id: "grid-question",
        question: "Which CSS Grid property would you use to create three equal-width columns?",
        options: [
          {
            id: "a",
            text: "grid-template-columns: 1fr 1fr 1fr",
            isCorrect: true
          },
          {
            id: "b",
            text: "grid-template-rows: 1fr 1fr 1fr",
            isCorrect: false
          },
          {
            id: "c",
            text: "grid-column: span 3",
            isCorrect: false
          },
          {
            id: "d",
            text: "grid-template: repeat(3, 1fr)",
            isCorrect: false
          }
        ]
      },
      {
        type: "completion",
        id: "css-layout-completion",
        title: "Congratulations!",
        message: "You've completed the CSS Layout Fundamentals lesson! You now understand the core concepts of CSS layout including the box model, display properties, positioning, Flexbox, and Grid. With these tools, you can create responsive and well-structured web layouts."
      }
    ]
  }
};

// Function to get a lesson by ID
export const getLessonById = async (id: string): Promise<Lesson> => {
  return new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      const lesson = lessons[id];
      if (lesson) {
        resolve(lesson);
      } else {
        reject(new Error(`Lesson with ID ${id} not found`));
      }
    }, 800);
  });
};

// Function to update lesson progress
export const updateLessonProgress = async (lessonId: string, progress: number): Promise<void> => {
  return new Promise((resolve) => {
    // Simulate API call to update progress
    setTimeout(() => {
      console.log(`Updated progress for lesson ${lessonId}: ${progress}%`);
      resolve();
    }, 300);
  });
};

// Function to add more lessons to the database
export const addLesson = (lesson: Lesson): void => {
  lessons[lesson.id] = lesson;
};