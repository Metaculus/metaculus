import { createContext, FC, PropsWithChildren, useContext } from "react";

import { MentionItem } from "../types";

type UserMentionsContextType = {
  defaultUserMentions?: MentionItem[];
};

const UserMentionsContext = createContext({} as UserMentionsContextType);

type ProviderProps = {
  defaultUserMentions?: MentionItem[];
};

/**
 * Propagate `defaultUserMentions` prop changes into mentions plugin component initialized with `addComposerChild$` cell.
 */
export const DefaultUserMentionsContextProvider: FC<
  PropsWithChildren<ProviderProps>
> = ({ defaultUserMentions, children }) => {
  return (
    <UserMentionsContext.Provider
      value={{
        defaultUserMentions,
      }}
    >
      {children}
    </UserMentionsContext.Provider>
  );
};

export default function useUserMentionsContext(): UserMentionsContextType {
  return useContext(UserMentionsContext);
}
