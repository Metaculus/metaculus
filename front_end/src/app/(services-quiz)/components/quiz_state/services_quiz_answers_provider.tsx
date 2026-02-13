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

export type ServicesQuizWhoForecasts =
  | { mode: "not_sure" }
  | { mode: "selected"; selections: Array<"pros" | "public" | "experts"> };

export type ServicesQuizAnswersState = {
  category: ServicesQuizCategory | null;
  selectedChallenges: string[];
  notes: string;
  timing: string | null;
  whoForecasts: ServicesQuizWhoForecasts | null;
  privacy: string | null;
  contactName: string;
  contactEmail: string;
  contactOrg: string;
  contactComments: string;
};

type AnswersApi = {
  state: ServicesQuizAnswersState;

  toggleChallenge: (ch: string) => void;
  setNotes: (v: string) => void;

  setTiming: (v: string | null) => void;

  toggleWhoForecastsSelection: (v: "pros" | "public" | "experts") => void;
  setWhoForecastsNotSure: () => void;
  clearWhoForecasts: () => void;

  setPrivacy: (v: string | null) => void;

  setContactName: (v: string) => void;
  setContactEmail: (v: string) => void;
  setContactOrg: (v: string) => void;
  setContactComments: (v: string) => void;
};

const Ctx = createContext<AnswersApi | null>(null);

export const useServicesQuizAnswers = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useServicesQuizAnswers must be used within provider");
  return ctx;
};

type Props = PropsWithChildren<{
  category: ServicesQuizCategory | null;
}>;

export const ServicesQuizAnswersProvider: FC<Props> = ({
  category,
  children,
}) => {
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [timing, setTiming] = useState<string | null>(null);
  const [whoForecasts, setWhoForecasts] =
    useState<ServicesQuizWhoForecasts | null>(null);

  const [privacy, setPrivacy] = useState<string | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactOrg, setContactOrg] = useState("");
  const [contactComments, setContactComments] = useState("");

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
        contactOrg,
        contactComments,
      },
      toggleChallenge: (ch) =>
        setSelectedChallenges((prev) =>
          prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]
        ),
      setNotes,
      setTiming,
      toggleWhoForecastsSelection: (v) =>
        setWhoForecasts((prev) => {
          if (!prev || prev.mode === "not_sure") {
            return { mode: "selected", selections: [v] };
          }

          const exists = prev.selections.includes(v);
          const nextSelections = exists
            ? prev.selections.filter((x) => x !== v)
            : [...prev.selections, v];

          if (nextSelections.length === 0) return null;

          return { mode: "selected", selections: nextSelections };
        }),
      setWhoForecastsNotSure: () => setWhoForecasts({ mode: "not_sure" }),
      clearWhoForecasts: () => setWhoForecasts(null),

      setPrivacy,
      setContactName,
      setContactEmail,
      setContactOrg,
      setContactComments,
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
      contactOrg,
      contactComments,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
