"use client";
import {
  PropsWithChildren,
  useContext,
  useState,
  FC,
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";

import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import useSearchInputState from "@/hooks/use_search_input_state";

interface GlobalSearchContextProps {
  globalSearch: string;
  updateGlobalSearch: (search: string) => void;
  setModifySearchParams: Dispatch<SetStateAction<boolean>>;
  isSearched: boolean;
  setIsSearched: Dispatch<SetStateAction<boolean>>;
}
const GlobalSearchContext = createContext<GlobalSearchContextProps>({
  globalSearch: "",
  updateGlobalSearch: () => {},
  setModifySearchParams: () => {},
  isSearched: false,
  setIsSearched: () => {},
});

export const GlobalSearchProvider: FC<PropsWithChildren> = ({ children }) => {
  const [modifySearchParams, setModifySearchParams] = useState(false);
  const [globalSearch, setGlobalSearch] = useSearchInputState(
    POST_TEXT_SEARCH_FILTER,
    {
      debounceTime: 500,
      mode: "server",
      modifySearchParams,
    }
  );
  const [isSearched, setIsSearched] = useState(false);

  const updateGlobalSearch = useCallback(
    (search: string) => {
      setGlobalSearch(search);
      if (modifySearchParams) {
        // automatically update searched flag when search is applied while typing
        setIsSearched(!!search);
      }
    },
    [modifySearchParams, setGlobalSearch]
  );

  return (
    <GlobalSearchContext.Provider
      value={{
        globalSearch,
        updateGlobalSearch,
        setModifySearchParams,
        isSearched,
        setIsSearched,
      }}
    >
      {children}
    </GlobalSearchContext.Provider>
  );
};

export const useGlobalSearchContext = () => useContext(GlobalSearchContext);
