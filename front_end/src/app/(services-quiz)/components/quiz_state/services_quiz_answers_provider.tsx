"use client";

import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

import { ServicesQuizCategory } from "../../constants";

export type ServicesQuizStepId = 1 | 2 | 3 | 4 | 5 | 6;

export type ServicesQuizAnswersState = {
  category: ServicesQuizCategory | null;
  selectedChallenges: string[];
  notes: string;
  timing: string | null;
  whoForecasts: string | null;
  privacy: string | null;
  contactName: string;
  contactEmail: string;
};

type AnswersApi = {
  state: ServicesQuizAnswersState;

  setCategory: (c: ServicesQuizCategory) => void;
  toggleChallenge: (ch: string) => void;
  setNotes: (v: string) => void;

  setTiming: (v: string) => void;
  setWhoForecasts: (v: string) => void;
  setPrivacy: (v: string) => void;

  setContactName: (v: string) => void;
  setContactEmail: (v: string) => void;
};

const Ctx = createContext<AnswersApi | null>(null);

export const useServicesQuizAnswers = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useServicesQuizAnswers must be used within provider");
  return ctx;
};

type Props = PropsWithChildren<{
  initialCategory: ServicesQuizCategory | null;
}>;

export const ServicesQuizAnswersProvider: FC<Props> = ({
  initialCategory,
  children,
}) => {
  const [category, setCategoryState] = useState<ServicesQuizCategory | null>(
    initialCategory
  );
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [timing, setTiming] = useState<string | null>(null);
  const [whoForecasts, setWhoForecasts] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<string | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const value = useMemo<AnswersApi>(
    () => ({
      state: {
        category,
        selectedChallenges,
        notes,
        timing,
        whoForecasts,
        privacy,
        contactName,
        contactEmail,
      },
      setCategory: (c) => {
        setCategoryState(c);
        setSelectedChallenges([]);
      },
      toggleChallenge: (ch) =>
        setSelectedChallenges((prev) =>
          prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]
        ),
      setNotes,
      setTiming,
      setWhoForecasts,
      setPrivacy,
      setContactName,
      setContactEmail,
    }),
    [
      category,
      selectedChallenges,
      notes,
      timing,
      whoForecasts,
      privacy,
      contactName,
      contactEmail,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
