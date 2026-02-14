import { createContext, FC, PropsWithChildren, useContext } from "react";

import { MentionItem } from "../types";

type UserMentionsContextType = {
  defaultUserMentions?: MentionItem[];
  postId?: number;
};

const UserMentionsContext = createContext({} as UserMentionsContextType);

type ProviderProps = {
  defaultUserMentions?: MentionItem[];
  postId?: number;
};

/**
 * Propagate `defaultUserMentions` prop changes into mentions plugin component initialized with `addComposerChild$` cell.
 */
export const DefaultUserMentionsContextProvider: FC<
  PropsWithChildren<ProviderProps>
> = ({ defaultUserMentions, postId, children }) => {
  return (
    <UserMentionsContext.Provider
      value={{
        defaultUserMentions,
        postId,
      }}
    >
      {children}
    </UserMentionsContext.Provider>
  );
};

export default function useUserMentionsContext(): UserMentionsContextType {
  return useContext(UserMentionsContext);
}
