"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

export type ModalType = "signin" | "signup";

export type ModalContextType = {
  modalType: ModalType | null;
  setModalType: (type: ModalType | null) => void;
};

//create a context, with createContext api
export const ModalContext = createContext<ModalContextType>({
  modalType: null,
  setModalType: () => {},
});

const ModalProvider: FC<PropsWithChildren> = ({ children }) => {
  const [modalType, setModalType] = useState<ModalType | null>(null);

  return (
    <ModalContext.Provider value={{ modalType, setModalType }}>
      {children}
    </ModalContext.Provider>
  );
};

export default ModalProvider;
export const useModal = () => useContext(ModalContext);
