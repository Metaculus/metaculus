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
import { getPostHogIdentity } from "@/utils/posthog_identity";

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
      // On first mount this runs before CSPostHogProvider's init (child
      // effects run first) and is a no-op; the provider identifies on load.
      // This covers users logging in or switching later in the page's life.
      const { distinctId, properties } = getPostHogIdentity(
        initialUser,
        locale
      );
      posthog.identify(distinctId, properties);
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
