"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";

type SurveyContextType = {
  questionIndex: number | null;
  setQuestionIndex: Dispatch<SetStateAction<number | null>>;
};

export const SurveyContext = createContext<SurveyContextType>({
  questionIndex: 0,
  setQuestionIndex: () => {},
});

const SurveyProvider: FC<PropsWithChildren> = ({ children }) => {
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);

  return (
    <SurveyContext.Provider value={{ questionIndex, setQuestionIndex }}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurvey = () => useContext(SurveyContext);
export default SurveyProvider;
