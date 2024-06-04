export type UserProfile = {
  id: number;
  username: string;
  date_joined: string;
  bio: string;
  website: string;
};

export type CurrentUser = UserProfile & {
  email: string;
};
