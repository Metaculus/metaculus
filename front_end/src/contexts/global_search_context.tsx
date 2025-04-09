"use client";
import {
  PropsWithChildren,
  useContext,
  useState,
  FC,
  createContext,
  useEffect,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";

import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import useSearchInputState from "@/hooks/use_search_input_state";

import { useNavigation } from "./navigation_context";

interface GlobalSearchContextProps {
  isVisible: boolean;
  setIsVisible: (a: boolean) => void;
  globalSearch: string;
  updateGlobalSearch: (search: string) => void;
  setModifySearchParams: Dispatch<SetStateAction<boolean>>;
  isSearched: boolean;
  setIsSearched: Dispatch<SetStateAction<boolean>>;
}
const GlobalSearchContext = createContext<GlobalSearchContextProps>({
  isVisible: false,
  setIsVisible: () => {},
  globalSearch: "",
  updateGlobalSearch: () => {},
  setModifySearchParams: () => {},
  isSearched: false,
  setIsSearched: () => {},
});

export const GlobalSearchProvider: FC<PropsWithChildren> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
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

  const { previousPath, currentPath } = useNavigation();
  useEffect(() => {
    if (previousPath !== currentPath && previousPath !== null) {
      setIsVisible(false);
    }
  }, [previousPath, currentPath]);
  const [delayedIsVisible, setDelayedIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setDelayedIsVisible(isVisible);
    }, 100);
  }, [isVisible]);

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
        isVisible: delayedIsVisible,
        setIsVisible,
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
