"use client";

import { usePostHog } from "posthog-js/react";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import { AuthContextType } from "@/types/auth";
import { CurrentUser } from "@/types/users";

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

const AuthProvider: FC<
  PropsWithChildren<{
    user: CurrentUser | null;
  }>
> = ({ user: initialUser, children }) => {
  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const posthog = usePostHog();
  useEffect(() => {
    if (initialUser) {
      const { id, username, is_superuser, is_staff } = initialUser;
      posthog.identify(id.toString(), {
        username,
        is_superuser,
        is_staff,
      });
    } else {
      posthog.reset();
    }

    setUser(initialUser);
  }, [initialUser, posthog]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export const useAuth = () => useContext(AuthContext);
