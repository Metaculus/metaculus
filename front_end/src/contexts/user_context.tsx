"use client";

import { createContext, FC, PropsWithChildren, useContext } from "react";
import { CurrentUser } from "@/types/users";

export type UserContextType = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser) => void;
};

//create a context, with createContext api
export const userContext = createContext<CurrentUser | null>(null);

const UserProvider: FC<PropsWithChildren<{ user: CurrentUser | null }>> = ({
  user,
  children,
}) => {
  return <userContext.Provider value={user}>{children}</userContext.Provider>;
};

export default UserProvider;

export const useUser = () => {
  return useContext(userContext);
};
