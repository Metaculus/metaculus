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
  questionIndex: number;
  setQuestionIndex: Dispatch<SetStateAction<number>>;
};

export const SurveyContext = createContext<SurveyContextType>({
  questionIndex: 0,
  setQuestionIndex: () => {},
});

const SurveyProvider: FC<PropsWithChildren> = ({ children }) => {
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  return (
    <SurveyContext.Provider value={{ questionIndex, setQuestionIndex }}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurvey = () => useContext(SurveyContext);
export default SurveyProvider;
