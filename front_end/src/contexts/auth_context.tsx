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
    locale?: string;
  }>
> = ({ user: initialUser, children, locale }) => {
  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const [syncedUser, setSyncedUser] = useState<CurrentUser | null>(initialUser);
  const posthog = usePostHog();

  // Adjust during render rather than in an effect: child effects run before
  // parent effects, so a page mounting right after logout would otherwise
  // read the signed-out user as still signed in for one commit — which is how
  // the tutorial popped up on the storefront after logging out.
  if (initialUser !== syncedUser) {
    setSyncedUser(initialUser);
    setUser(initialUser);
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUser, posthog]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export const useAuth = () => useContext(AuthContext);
