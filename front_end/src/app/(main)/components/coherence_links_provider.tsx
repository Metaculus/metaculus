"use client";

import { isNil } from "lodash";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { useAuth } from "@/contexts/auth_context";
import ClientCoherenceLinksApi from "@/services/api/coherence_links/coherence_links.client";
import { FetchedCoherenceLinks } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question } from "@/types/question";

type BaseProviderProps = {
  post: Post;
};

export type LinkIdToQuestionMap = Map<number, Question>;

export type CoherenceLinksContextType = {
  coherenceLinks: FetchedCoherenceLinks;
  updateCoherenceLinks: () => Promise<void>;
  getOtherQuestions: () => LinkIdToQuestionMap;
};

export const CoherenceLinksContext =
  createContext<CoherenceLinksContextType | null>(null);

export const CoherenceLinksProvider: FC<
  PropsWithChildren<BaseProviderProps>
> = ({ children, post }) => {
  const [coherenceLinks, setCoherenceLinks] = useState<FetchedCoherenceLinks>({
    data: [],
  });
  const { user } = useAuth();
  const isLoggedIn = !isNil(user);

  const updateCoherenceLinks = async () => {
    if (isLoggedIn) {
      ClientCoherenceLinksApi.getCoherenceLinksForPost(post)
        .then((links) => setCoherenceLinks(links))
        .catch((error) => console.log(error));
    } else {
      setCoherenceLinks({ data: [] });
    }
  };

  const getOtherQuestions = () => {
    const questionData = new Map<number, Question>();
    const questionID = post.question?.id;
    if (!questionID) return questionData;
    for (const link of coherenceLinks.data) {
      const otherQuestion =
        questionID === link.question1_id ? link.question2 : link.question1;
      questionData.set(link.id, otherQuestion);
    }
    return questionData;
  };

  return (
    <CoherenceLinksContext.Provider
      value={{ coherenceLinks, updateCoherenceLinks, getOtherQuestions }}
    >
      {children}
    </CoherenceLinksContext.Provider>
  );
};

export default function useCoherenceLinksContext(): CoherenceLinksContextType {
  const context = useContext(CoherenceLinksContext);
  if (!context) {
    throw new Error(
      "useCoherenceLinksContext must be used within a CoherenceLinksProvider"
    );
  }
  return context;
}
