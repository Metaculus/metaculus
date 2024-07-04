"use client";
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";

type EmbedModalContext = {
  isOpen: boolean;
  updateIsOpen: (open: boolean) => void;
};

const EmbedModalContext = createContext({} as EmbedModalContext);

export const EmbedModalContextProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const updateIsOpen = useCallback((open: boolean) => setIsOpen(open), []);

  return (
    <EmbedModalContext.Provider
      value={{
        isOpen,
        updateIsOpen,
      }}
    >
      {children}
    </EmbedModalContext.Provider>
  );
};

export default function useEmbedModalContext(): EmbedModalContext {
  return useContext(EmbedModalContext);
}
