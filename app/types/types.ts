// types/types.ts
export interface PostType {
    id: string;
    userName: string;
    userTitle: string;
    userProfilePic?: string;
    timePosted: string;
    text: string;
    image?: string;
    likes: number;
    comments: number;
  }