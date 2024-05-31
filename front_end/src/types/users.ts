export type CurrentUser = {
  id: string;
  username: string;
  email: string;
};

export type UserContextType = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
};
