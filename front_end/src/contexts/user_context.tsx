"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { CurrentUser, UserContextType } from "@/types/users";

//create a context, with createContext api
export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

const UserProvider: FC<PropsWithChildren<{ user: CurrentUser | null }>> = ({
  user: initialUser,
  children,
}) => {
  const [user, setUser] = useState<CurrentUser | null>(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
export const useUser = () => useContext(UserContext);
