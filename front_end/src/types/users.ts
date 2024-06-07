export type UserProfile = {
  id: number;
  username: string;
  date_joined: string;
  bio: string;
  website: string;
  formerly_known_as?: string;
};

export type CurrentUser = UserProfile & {
  email: string;
};
