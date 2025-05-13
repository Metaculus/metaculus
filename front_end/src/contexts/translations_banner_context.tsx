"use client";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

interface TranslationsBannerContextProps {
  bannerIsVisible: boolean;
  setBannerIsVisible: (a: boolean) => void;
}

const TranslationsBannerContext = createContext<TranslationsBannerContextProps>(
  {
    bannerIsVisible: false,
    setBannerIsVisible: () => {},
  }
);
export const TranslationsBannerProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [bannerIsVisible, setBannerIsVisible] = useState(false);
  return (
    <TranslationsBannerContext.Provider
      value={{ setBannerIsVisible, bannerIsVisible }}
    >
      {children}
    </TranslationsBannerContext.Provider>
  );
};

export const useContentTranslatedBannerContext = () =>
  useContext(TranslationsBannerContext);
