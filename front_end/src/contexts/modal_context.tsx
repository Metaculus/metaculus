"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
  useEffect, // Add this import
} from "react";

export type ModalType =
  | "signin"
  | "signup"
  | "signupSuccess"
  | "resetPassword"
  | "resetPasswordConfirm"
  | "contactUs"
  | "onboarding"
  | "confirm";

export type CurrentModal = {
  type: ModalType;
  data?: any;
};

export type CurrentModalContextType = {
  currentModal: CurrentModal | null;
  setCurrentModal: (type: CurrentModal | null) => void;
};

export const ModalContext = createContext<CurrentModalContextType>({
  currentModal: null,
  setCurrentModal: () => {},
});

const ModalProvider: FC<PropsWithChildren> = ({ children }) => {
  const [currentModal, setCurrentModal] = useState<CurrentModal | null>(null);

  // Add this useEffect hook
  useEffect(() => {
    window.setCurrentModal = setCurrentModal;
  }, []);

  return (
    <ModalContext.Provider value={{ currentModal, setCurrentModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export default ModalProvider;
export const useModal = () => useContext(ModalContext);

// Add this type declaration at the end of the file
declare global {
  interface Window {
    setCurrentModal: (modal: CurrentModal | null) => void;
  }
}
