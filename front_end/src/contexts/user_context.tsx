"use client";

import { createContext, FC, PropsWithChildren, useContext } from "react";
import { CurrentUser } from "@/types/users";

export type UserContextType = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser) => void;
};

//create a context, with createContext api
export const UserContext = createContext<CurrentUser | null>(null);

const UserProvider: FC<PropsWithChildren<{ user: CurrentUser | null }>> = ({
  user,
  children,
}) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export default UserProvider;

export const useUser = () => useContext(UserContext);
