"use client";
import {
  PropsWithChildren,
  useContext,
  useState,
  FC,
  createContext,
  useEffect,
} from "react";

import { POST_TEXT_SEARCH_FILTER } from "@/constants/posts_feed";
import useSearchInputState from "@/hooks/use_search_input_state";

interface GlobalSearchContextProps {
  isVisible: boolean;
  setIsVisible: (a: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
}
const GlobalSearchContext = createContext<GlobalSearchContextProps>({
  isVisible: false,
  setIsVisible: (a) => {},
  globalSearch: "",
  setGlobalSearch: (s) => {},
});

export const GlobalSearchProvider: FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [globalSearch, setGlobalSearch] = useSearchInputState(
    POST_TEXT_SEARCH_FILTER
  );

  const [delayedIsVisible, setDelayedIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setDelayedIsVisible(isVisible);
    }, 100);
  }, [isVisible]);

  return (
    <GlobalSearchContext.Provider
      value={{
        isVisible: delayedIsVisible,
        setIsVisible,
        globalSearch,
        setGlobalSearch,
      }}
    >
      {children}
    </GlobalSearchContext.Provider>
  );
};

export const useGlobalSearchContext = () => useContext(GlobalSearchContext);
