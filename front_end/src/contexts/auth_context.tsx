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
import { v4 } from "uuid";

import { AuthContextType } from "@/types/auth";
import { CurrentUser } from "@/types/users";

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

const ANONYMOUS_SESSION_ID_KEY = "anonymous_session_id";

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
      if (posthog._isIdentified()) {
        posthog.reset();
      }
      const anonymousId = sessionStorage.getItem(ANONYMOUS_SESSION_ID_KEY);
      if (!anonymousId) {
        const newAnonymousId = v4();
        sessionStorage.setItem(ANONYMOUS_SESSION_ID_KEY, newAnonymousId);

        posthog.identify(newAnonymousId);
      } else {
        posthog.identify(anonymousId);
      }
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
