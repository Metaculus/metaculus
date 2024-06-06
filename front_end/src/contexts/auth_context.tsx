"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { AuthContextType, SocialProvider } from "@/types/auth";
import { CurrentUser } from "@/types/users";

//create a context, with createContext api
export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  socialProviders: null,
  setSocialProviders: () => {},
});

const AuthProvider: FC<
  PropsWithChildren<{
    user: CurrentUser | null;
    socialProviders: SocialProvider[] | null;
  }>
> = ({
  user: initialUser,
  socialProviders: initialSocialProviders,
  children,
}) => {
  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const [socialProviders, setSocialProviders] = useState<
    SocialProvider[] | null
  >(initialSocialProviders);

  console.log("CURRENT_USER: ", user);

  return (
    <AuthContext.Provider
      value={{ user, setUser, socialProviders, setSocialProviders }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export const useAuth = () => useContext(AuthContext);
