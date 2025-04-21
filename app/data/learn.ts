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
  },
    "graphic-design-composition": {
      "id": "composition",
      "title": "Graphic Design Composition",
      "description": "Explore the fundamental principles of graphic design composition, including balance, contrast, alignment, and hierarchy, to create visually compelling designs.",
      "cards": [
        {
          "type": "information",
          "id": "composition-intro",
          "title": "Introduction to Design Composition",
          "content": "Composition in graphic design refers to the arrangement of visual elements in a layout. A well-composed design guides the viewer's eye and effectively communicates the intended message. Key principles include balance, contrast, alignment, hierarchy, and proximity.",
          "youtubeId": "dQw4w9WgXcQ"
        },
        {
          "type": "information",
          "id": "balance",
          "title": "Balance in Design",
          "content": "Balance involves distributing elements evenly to create a sense of stability. There are three types of balance:\n\n• Symmetrical: Elements are mirrored on either side of an axis.\n• Asymmetrical: Different elements are arranged to create a balanced composition.\n• Radial: Elements radiate from a central point.",
          "youtubeId": "eVTXPUF4Oz4"
        },
        {
          "type": "question",
          "id": "balance-question",
          "question": "Which type of balance involves mirroring elements on either side of a central axis?",
          "options": [
            {
              "id": "a",
              "text": "Asymmetrical balance",
              "isCorrect": false
            },
            {
              "id": "b",
              "text": "Radial balance",
              "isCorrect": false
            },
            {
              "id": "c",
              "text": "Symmetrical balance",
              "isCorrect": true
            },
            {
              "id": "d",
              "text": "Dynamic balance",
              "isCorrect": false
            }
          ]
        },
        {
          "type": "information",
          "id": "contrast",
          "title": "Contrast in Design",
          "content": "Contrast emphasizes differences between elements to create visual interest and focal points. It can be achieved through variations in color, size, shape, texture, and typography.",
          "youtubeId": "3GwjfUFyY6M"
        },
        {
          "type": "question",
          "id": "contrast-question",
          "question": "Which of the following is NOT a common method to create contrast in design?",
          "options": [
            {
              "id": "a",
              "text": "Using different colors",
              "isCorrect": false
            },
            {
              "id": "b",
              "text": "Varying font sizes",
              "isCorrect": false
            },
            {
              "id": "c",
              "text": "Aligning all elements centrally",
              "isCorrect": true
            },
            {
              "id": "d",
              "text": "Mixing textures",
              "isCorrect": false
            }
          ]
        },
        {
          "type": "information",
          "id": "alignment",
          "title": "Alignment in Design",
          "content": "Alignment ensures that elements are visually connected and organized. Proper alignment creates a clean, cohesive look and improves readability.",
          "youtubeId": "2vjPBrBU-TM"
        },
        {
          "type": "question",
          "id": "alignment-question",
          "question": "Why is alignment important in graphic design?",
          "options": [
            {
              "id": "a",
              "text": "It makes the design look chaotic",
              "isCorrect": false
            },
            {
              "id": "b",
              "text": "It creates visual connections between elements",
              "isCorrect": true
            },
            {
              "id": "c",
              "text": "It limits creativity",
              "isCorrect": false
            },
            {
              "id": "d",
              "text": "It increases the number of colors used",
              "isCorrect": false
            }
          ]
        },
        {
          "type": "information",
          "id": "hierarchy",
          "title": "Visual Hierarchy",
          "content": "Visual hierarchy guides the viewer's eye to the most important elements first. This is achieved through size, color, contrast, and placement, helping to prioritize information effectively.",
          "youtubeId": "oHg5SJYRHA0"
        },
        {
          "type": "question",
          "id": "hierarchy-question",
          "question": "Which technique is commonly used to establish visual hierarchy?",
          "options": [
            {
              "id": "a",
              "text": "Using the same font size for all text",
              "isCorrect": false
            },
            {
              "id": "b",
              "text": "Placing important elements in less noticeable areas",
              "isCorrect": false
            },
            {
              "id": "c",
              "text": "Utilizing size and contrast to highlight key elements",
              "isCorrect": true
            },
            {
              "id": "d",
              "text": "Avoiding any variation in design elements",
              "isCorrect": false
            }
          ]
        },
        {
          "type": "completion",
          "id": "composition-completion",
          "title": "Congratulations!",
          "message": "You've completed the Graphic Design Composition module! You now have a solid understanding of how to use balance, contrast, alignment, and hierarchy to create effective and visually appealing designs."
        }
      ]
    },
    "react-state-management": {
        "id": "react-state-management",
        "title": "React State Management",
        "description": "Explore the fundamentals of managing state in React applications, including useState, useReducer, Context API, and third-party libraries like Redux.",
        "cards": [
          {
            "type": "information",
            "id": "state-management-intro",
            "title": "Introduction to State Management",
            "content": "State management in React refers to the handling of data that influences the behavior and rendering of components. Effective state management ensures that your application responds correctly to user interactions and data changes. This lesson covers local state with useState, complex state with useReducer, global state with Context API, and external libraries like Redux.",
            "youtubeId": "35lXWvCuM8o"
          },
          {
            "type": "information",
            "id": "use-state",
            "title": "Managing State with useState",
            "content": "The useState hook allows you to add state to functional components. It returns a stateful value and a function to update it. Example:\n\n```jsx\nconst [count, setCount] = useState(0);\n```\n\nThis hook is ideal for simple state logic, such as toggling UI elements or tracking form inputs.",
            "youtubeId": "O6P86uwfdR0"
          },
          {
            "type": "question",
            "id": "use-state-question",
            "question": "What does the useState hook return?",
            "options": [
              {
                "id": "a",
                "text": "An object with state and setState properties",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "A single value representing the current state",
                "isCorrect": false
              },
              {
                "id": "c",
                "text": "An array with the current state and a function to update it",
                "isCorrect": true
              },
              {
                "id": "d",
                "text": "A function that initializes state",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "information",
            "id": "use-reducer",
            "title": "Managing Complex State with useReducer",
            "content": "The useReducer hook is suitable for managing complex state logic involving multiple sub-values or when the next state depends on the previous one. It accepts a reducer function and an initial state. Example:\n\n```jsx\nconst [state, dispatch] = useReducer(reducer, initialState);\n```\n\nThis approach is beneficial for scenarios like form handling or managing state transitions.",
            "youtubeId": "kK_Wqx3RnHk"
          },
          {
            "type": "question",
            "id": "use-reducer-question",
            "question": "In which scenario is useReducer preferred over useState?",
            "options": [
              {
                "id": "a",
                "text": "When managing simple toggle states",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "When dealing with complex state logic or multiple related state variables",
                "isCorrect": true
              },
              {
                "id": "c",
                "text": "When you need to fetch data from an API",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "When styling components dynamically",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "information",
            "id": "context-api",
            "title": "Sharing State with Context API",
            "content": "The Context API allows you to share state across the component tree without prop drilling. Create a context using React.createContext, provide it at a higher level, and consume it in nested components. This is ideal for global data like themes, user authentication, or language settings.",
            "youtubeId": "35lXWvCuM8o"
          },
          {
            "type": "question",
            "id": "context-api-question",
            "question": "What problem does the Context API solve?",
            "options": [
              {
                "id": "a",
                "text": "Managing local component state",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "Avoiding prop drilling by providing a way to pass data through the component tree",
                "isCorrect": true
              },
              {
                "id": "c",
                "text": "Handling asynchronous data fetching",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "Styling components with CSS-in-JS",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "information",
            "id": "redux",
            "title": "State Management with Redux",
            "content": "Redux is a popular library for managing global state in React applications. It uses a single store to hold the entire state of the app and enforces unidirectional data flow. Actions describe state changes, and reducers specify how the state updates in response to actions. While powerful, Redux introduces additional complexity and is best suited for large-scale applications.",
            "youtubeId": "poQXNp9ItL4"
          },
          {
            "type": "question",
            "id": "redux-question",
            "question": "What is the primary purpose of Redux in a React application?",
            "options": [
              {
                "id": "a",
                "text": "To style components using a centralized theme",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "To manage global state in a predictable and centralized manner",
                "isCorrect": true
              },
              {
                "id": "c",
                "text": "To handle routing between different pages",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "To fetch data from APIs",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "completion",
            "id": "state-management-completion",
            "title": "Well Done!",
            "message": "You've completed the React State Management lesson! You now have a solid understanding of managing state using useState, useReducer, Context API, and Redux. These tools will help you build dynamic and responsive React applications."
          }
        ]
      },
      "ui-fundamentals": {
        "id": "ui-fundamentals",
        "title": "UI Fundamentals",
        "description": "Explore the core principles and techniques essential for designing and developing effective user interfaces.",
        "cards": [
          {
            "type": "information",
            "id": "ui-intro",
            "title": "Introduction to UI Fundamentals",
            "content": "User Interface (UI) design focuses on anticipating what users might need to do and ensuring that the interface has elements that are easy to access, understand, and use. This module covers the foundational concepts of UI design, including usability principles, layout structures, and interactive components.",
            "youtubeId": "dD2EISBDjWM"
          },
          {
            "type": "information",
            "id": "ui-principles",
            "title": "Principles of Effective UI Design",
            "content": "Effective UI design is guided by principles such as consistency, clarity, feedback, and efficiency. These principles help create interfaces that are intuitive and user-friendly, enhancing the overall user experience.",
            "youtubeId": "3YcZ3Zqk0a8"
          },
          {
            "type": "question",
            "id": "ui-principles-question",
            "question": "Which principle emphasizes the importance of providing users with timely responses to their actions?",
            "options": [
              {
                "id": "a",
                "text": "Consistency",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "Feedback",
                "isCorrect": true
              },
              {
                "id": "c",
                "text": "Clarity",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "Efficiency",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "information",
            "id": "ui-layout",
            "title": "UI Layout and Composition",
            "content": "Layout and composition involve arranging UI elements in a way that guides users through the interface. Key concepts include alignment, visual hierarchy, spacing, and grouping, which collectively contribute to a coherent and navigable design.",
            "youtubeId": "G1eWZ6a80vI"
          },
          {
            "type": "question",
            "id": "ui-layout-question",
            "question": "What design principle helps users understand the importance of elements based on their visual prominence?",
            "options": [
              {
                "id": "a",
                "text": "Alignment",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "Visual Hierarchy",
                "isCorrect": true
              },
              {
                "id": "c",
                "text": "Spacing",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "Grouping",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "information",
            "id": "ui-interactivity",
            "title": "Interactive Elements in UI",
            "content": "Interactive elements like buttons, links, and forms are crucial for user engagement. Designing these elements involves ensuring they are easily identifiable, responsive, and provide appropriate feedback upon interaction.",
            "youtubeId": "kGzjvH9v3vA"
          },
          {
            "type": "question",
            "id": "ui-interactivity-question",
            "question": "Which of the following is NOT typically considered an interactive UI element?",
            "options": [
              {
                "id": "a",
                "text": "Button",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "Image",
                "isCorrect": true
              },
              {
                "id": "c",
                "text": "Link",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "Form Input",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "information",
            "id": "ui-responsiveness",
            "title": "Responsive Design Principles",
            "content": "Responsive design ensures that UI adapts seamlessly across various devices and screen sizes. Techniques include flexible grids, media queries, and scalable assets to provide a consistent user experience.",
            "youtubeId": "srvUrASNj0s"
          },
          {
            "type": "question",
            "id": "ui-responsiveness-question",
            "question": "What CSS feature is commonly used to apply different styles based on device characteristics?",
            "options": [
              {
                "id": "a",
                "text": "Flexbox",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "Media Queries",
                "isCorrect": true
              },
              {
                "id": "c",
                "text": "Grid Layout",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "Pseudo-classes",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "completion",
            "id": "ui-fundamentals-completion",
            "title": "Well Done!",
            "message": "You've successfully completed the UI Fundamentals module! You're now equipped with the essential knowledge to design intuitive and effective user interfaces."
          }
        ]
      },

      "ts-advanced": {
        "id": "typescript-advanced-types",
        "title": "Advanced Types in TypeScript",
        "description": "Dive deep into TypeScript's advanced type system, including union and intersection types, type guards, mapped types, and conditional types.",
        "cards": [
          {
            "type": "information",
            "id": "advanced-types-intro",
            "title": "Introduction to Advanced Types",
            "content": "TypeScript's advanced types allow for more precise type definitions and safer code. In this lesson, we'll explore union and intersection types, type guards, mapped types, and conditional types to enhance your TypeScript skills.",
            "youtubeId": "zQnBQ4tB3ZA"
          },
          {
            "type": "information",
            "id": "union-intersection-types",
            "title": "Union and Intersection Types",
            "content": "Union types allow a variable to be one of several types, using the '|' operator. Intersection types combine multiple types into one, using the '&' operator. These are powerful tools for flexible and precise type definitions.",
            "youtubeId": "zQnBQ4tB3ZA"
          },
          {
            "type": "question",
            "id": "union-intersection-question",
            "question": "What is the result of combining two types using the '&' operator in TypeScript?",
            "options": [
              {
                "id": "a",
                "text": "A union type",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "An intersection type",
                "isCorrect": true
              },
              {
                "id": "c",
                "text": "A tuple type",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "A mapped type",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "information",
            "id": "type-guards",
            "title": "Type Guards",
            "content": "Type guards are expressions that perform runtime checks to ensure a variable is of a specific type. They help TypeScript narrow down the type within a conditional block, enhancing type safety.",
            "youtubeId": "zQnBQ4tB3ZA"
          },
          {
            "type": "question",
            "id": "type-guards-question",
            "question": "Which of the following is an example of a type guard in TypeScript?",
            "options": [
              {
                "id": "a",
                "text": "typeof variable === 'string'",
                "isCorrect": true
              },
              {
                "id": "b",
                "text": "variable = 'string'",
                "isCorrect": false
              },
              {
                "id": "c",
                "text": "variable: string",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "string(variable)",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "information",
            "id": "mapped-types",
            "title": "Mapped Types",
            "content": "Mapped types allow you to create new types by transforming properties of an existing type. They are useful for creating variations of existing types, such as making all properties optional or readonly.",
            "youtubeId": "zQnBQ4tB3ZA"
          },
          {
            "type": "question",
            "id": "mapped-types-question",
            "question": "What does the following mapped type do?\n\n```typescript\n{ [K in keyof T]: T[K]; }\n```",
            "options": [
              {
                "id": "a",
                "text": "Creates a new type with the same properties as T",
                "isCorrect": true
              },
              {
                "id": "b",
                "text": "Creates a union of all properties in T",
                "isCorrect": false
              },
              {
                "id": "c",
                "text": "Makes all properties in T optional",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "Removes all properties from T",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "information",
            "id": "conditional-types",
            "title": "Conditional Types",
            "content": "Conditional types allow you to define a type based on a condition. They use the syntax 'T extends U ? X : Y' to choose between two types based on whether T extends U.",
            "youtubeId": "zQnBQ4tB3ZA"
          },
          {
            "type": "question",
            "id": "conditional-types-question",
            "question": "In the conditional type 'T extends U ? X : Y', what happens if T does not extend U?",
            "options": [
              {
                "id": "a",
                "text": "Type X is used",
                "isCorrect": false
              },
              {
                "id": "b",
                "text": "Type Y is used",
                "isCorrect": true
              },
              {
                "id": "c",
                "text": "An error is thrown",
                "isCorrect": false
              },
              {
                "id": "d",
                "text": "T is used as the type",
                "isCorrect": false
              }
            ]
          },
          {
            "type": "completion",
            "id": "advanced-types-completion",
            "title": "Congratulations!",
            "message": "You've completed the Advanced Types in TypeScript lesson! You now have a deeper understanding of union and intersection types, type guards, mapped types, and conditional types. These tools will help you write more robust and flexible TypeScript code."
          }
        ]
      },
  "css-animation": {
    "id": "css-animation",
    "title": "CSS Animation Fundamentals",
    "description": "Explore the principles of CSS animations, including transitions, keyframes, and animation properties to bring your web designs to life.",
    "cards": [
      {
        "type": "information",
        "id": "css-animation-intro",
        "title": "Introduction to CSS Animation",
        "content": "CSS animations allow you to animate transitions from one CSS style configuration to another. They enhance user experience by providing visual feedback and engaging interactions. In this lesson, we'll delve into transitions, keyframes, and animation properties.",
        "youtubeId": "YszONjKpgg4"
      },
      {
        "type": "information",
        "id": "css-transitions",
        "title": "CSS Transitions",
        "content": "CSS transitions enable smooth changes between property values. Key properties include:\n\n• transition-property: Specifies the CSS property to transition\n• transition-duration: Defines the duration of the transition\n• transition-timing-function: Describes how the intermediate values are calculated\n• transition-delay: Sets a delay before the transition starts",
        "youtubeId": "TKoX1p5Yj1U"
      },
      {
        "type": "question",
        "id": "transitions-question",
        "question": "Which CSS property specifies the duration of a transition effect?",
        "options": [
          {
            "id": "a",
            "text": "transition-delay",
            "isCorrect": false
          },
          {
            "id": "b",
            "text": "transition-duration",
            "isCorrect": true
          },
          {
            "id": "c",
            "text": "transition-property",
            "isCorrect": false
          },
          {
            "id": "d",
            "text": "transition-timing-function",
            "isCorrect": false
          }
        ]
      },
      {
        "type": "information",
        "id": "css-keyframes",
        "title": "CSS Keyframes",
        "content": "Keyframes allow you to create complex animations by defining styles at various points during the animation sequence. Use the @keyframes rule to define the animation and then apply it using the animation-name property.",
        "youtubeId": "wGzjO6N6J6Y"
      },
      {
        "type": "question",
        "id": "keyframes-question",
        "question": "What is the purpose of the @keyframes rule in CSS?",
        "options": [
          {
            "id": "a",
            "text": "To define the duration of an animation",
            "isCorrect": false
          },
          {
            "id": "b",
            "text": "To specify the timing function of an animation",
            "isCorrect": false
          },
          {
            "id": "c",
            "text": "To define the intermediate steps in an animation sequence",
            "isCorrect": true
          },
          {
            "id": "d",
            "text": "To set the delay before an animation starts",
            "isCorrect": false
          }
        ]
      },
      {
        "type": "information",
        "id": "animation-properties",
        "title": "Animation Properties",
        "content": "CSS provides several properties to control animations:\n\n• animation-name: Specifies the name of the @keyframes animation\n• animation-duration: Sets how long the animation takes to complete one cycle\n• animation-timing-function: Describes how the animation progresses over time\n• animation-delay: Delays the start of the animation\n• animation-iteration-count: Specifies the number of times the animation should repeat\n• animation-direction: Defines whether the animation should play in reverse on alternate cycles",
        "youtubeId": "wGzjO6N6J6Y"
      },
      {
        "type": "question",
        "id": "animation-properties-question",
        "question": "Which property controls how many times an animation should play?",
        "options": [
          {
            "id": "a",
            "text": "animation-delay",
            "isCorrect": false
          },
          {
            "id": "b",
            "text": "animation-duration",
            "isCorrect": false
          },
          {
            "id": "c",
            "text": "animation-iteration-count",
            "isCorrect": true
          },
          {
            "id": "d",
            "text": "animation-direction",
            "isCorrect": false
          }
        ]
      },
      {
        "type": "completion",
        "id": "css-animation-completion",
        "title": "Well Done!",
        "message": "You've completed the CSS Animation Fundamentals lesson! You now have a solid understanding of how to create engaging animations using transitions, keyframes, and various animation properties."
      }
    ]
  },

  "mobile-first": {
    "id": "mobile-first",
    "title": "Mobile First Approach in Responsive Web Design",
    "description": "Understand the Mobile First strategy in web design, its benefits, how to implement it using CSS media queries, and how it aligns with modern development best practices.",
    "cards": [
      {
        "type": "information",
        "id": "mobile-first-intro",
        "title": "Introduction to Mobile First Design",
        "content": "The Mobile First approach is a design strategy that starts with designing for the smallest screens first and progressively enhancing the experience for larger screens. This ensures optimal usability and performance on mobile devices, which now dominate internet usage. In this lesson, we’ll explore the core concepts of Mobile First design, media queries, and responsive design techniques.",
        "youtubeId": "dceKQ5Yka1k"
      },
      {
        "type": "information",
        "id": "mobile-first-benefits",
        "title": "Why Mobile First Matters",
        "content": "Designing with mobile users in mind ensures a fast, accessible, and user-centric experience. Benefits include:\n\n• Faster load times on mobile devices\n• Improved accessibility\n• Better SEO performance\n• Easier progressive enhancement\n\nMobile First also encourages focusing on essential features, reducing clutter, and prioritizing content.",
        "youtubeId": "VJkz0vpr1e8"
      },
      {
        "type": "question",
        "id": "mobile-first-question",
        "question": "Which of the following best describes the Mobile First approach?",
        "options": [
          {
            "id": "a",
            "text": "Designing for desktops first, then hiding features for smaller screens",
            "isCorrect": false
          },
          {
            "id": "b",
            "text": "Designing simultaneously for all screen sizes",
            "isCorrect": false
          },
          {
            "id": "c",
            "text": "Designing for mobile devices first, then enhancing for larger screens",
            "isCorrect": true
          },
          {
            "id": "d",
            "text": "Using fixed-width layouts only",
            "isCorrect": false
          }
        ]
      },
      {
        "type": "information",
        "id": "media-queries",
        "title": "CSS Media Queries for Responsive Design",
        "content": "Media queries allow you to apply CSS styles based on screen size, resolution, and device type. In a Mobile First approach, you write default styles for mobile devices and use min-width media queries to adapt the layout for larger screens.\n\nExample:\n```css\n/* Mobile styles (default) */\nbody { font-size: 14px; }\n\n/* Tablet and up */\n@media (min-width: 768px) {\n  body { font-size: 16px; }\n}\n\n/* Desktop and up */\n@media (min-width: 1024px) {\n  body { font-size: 18px; }\n}\n```",
        "youtubeId": "5KGah8bWgEU"
      },
      {
        "type": "question",
        "id": "media-query-question",
        "question": "In a Mobile First design, which type of media query is commonly used to adjust styles for larger screens?",
        "options": [
          {
            "id": "a",
            "text": "max-width",
            "isCorrect": false
          },
          {
            "id": "b",
            "text": "min-width",
            "isCorrect": true
          },
          {
            "id": "c",
            "text": "device-width",
            "isCorrect": false
          },
          {
            "id": "d",
            "text": "orientation",
            "isCorrect": false
          }
        ]
      },
      {
        "type": "information",
        "id": "mobile-first-techniques",
        "title": "Techniques for Mobile First Development",
        "content": "Here are key techniques for implementing Mobile First design:\n\n• Use fluid layouts and percentage-based widths\n• Prioritize performance with optimized assets\n• Hide/show content conditionally with CSS\n• Test early and often on real mobile devices\n\nMobile First isn’t just a technique—it’s a mindset that ensures users on smaller devices get the best experience possible.",
        "youtubeId": "Fv_2F4-lq0g"
      },
      {
        "type": "question",
        "id": "technique-question",
        "question": "Which technique supports Mobile First design principles?",
        "options": [
          {
            "id": "a",
            "text": "Using fixed pixel values for all layouts",
            "isCorrect": false
          },
          {
            "id": "b",
            "text": "Loading large images by default",
            "isCorrect": false
          },
          {
            "id": "c",
            "text": "Using flexible grids and responsive images",
            "isCorrect": true
          },
          {
            "id": "d",
            "text": "Designing only for desktop",
            "isCorrect": false
          }
        ]
      },
      {
        "type": "completion",
        "id": "mobile-first-completion",
        "title": "Well Done!",
        "message": "You've completed the Mobile First Approach lesson! You now understand why it’s important, how to implement it with media queries, and how to build fast, accessible, and responsive web designs for users across all devices. Keep going—you’re on your way to becoming a responsive design pro!"
      }
    ]
  },
 

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