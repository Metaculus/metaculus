"use client";
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";

type EmbedElectionsModalContext = {
  isOpen: boolean;
  updateIsOpen: (open: boolean) => void;
};

const EmbedElectionsModalContext = createContext(
  {} as EmbedElectionsModalContext
);

export const EmbedElectionsModalContextProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const updateIsOpen = useCallback((open: boolean) => setIsOpen(open), []);

  return (
    <EmbedElectionsModalContext.Provider
      value={{
        isOpen,
        updateIsOpen,
      }}
    >
      {children}
    </EmbedElectionsModalContext.Provider>
  );
};

export default function useEmbedElectionsModalContext(): EmbedElectionsModalContext {
  return useContext(EmbedElectionsModalContext);
}
