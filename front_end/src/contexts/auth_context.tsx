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
  csrfToken: null,
});

const AuthProvider: FC<
  PropsWithChildren<{
    user: CurrentUser | null;
    locale?: string;
    csrfToken: string | null;
  }>
> = ({ user: initialUser, children, locale, csrfToken }) => {
  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const posthog = usePostHog();

  useEffect(() => {
    if (initialUser) {
      const { id, username, is_superuser, is_staff, language } = initialUser;
      posthog.identify(id.toString(), {
        username,
        is_superuser,
        is_staff,
        locale,
        language: language || locale,
      });
    } else {
      if (posthog._isIdentified()) {
        posthog.reset();
      }
    }

    setUser(initialUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUser, posthog]);

  return (
    <AuthContext.Provider value={{ user, setUser, csrfToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export const useAuth = () => useContext(AuthContext);
