"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import ClientCoherenceLinksApi from "@/services/api/coherence_links/coherence_links.client";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CoherenceLinksGroup } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question } from "@/types/question";

type BaseProviderProps = {
  post: Post;
};

export type LinkIdToQuestionMap = Map<number, Question>;

export type CoherenceLinksContextType = {
  coherenceLinks: CoherenceLinksGroup;
  updateCoherenceLinks: () => Promise<void>;
  getOtherQuestions: (questionID: number) => Promise<LinkIdToQuestionMap>;
};

export const CoherenceLinksContext =
  createContext<CoherenceLinksContextType | null>(null);

export const CoherenceLinksProvider: FC<
  PropsWithChildren<BaseProviderProps>
> = ({ children, post }) => {
  const [coherenceLinks, setCoherenceLinks] = useState<CoherenceLinksGroup>({
    size: 0,
    data: [],
  });

  const updateCoherenceLinks = async () => {
    ClientCoherenceLinksApi.getCoherenceLinksForPost(post)
      .then((links) => setCoherenceLinks(links))
      .catch((error) => console.log(error));
  };

  const getOtherQuestions = async (questionID: number) => {
    const questionData = new Map<number, Question>();
    for (const link of coherenceLinks.data) {
      const otherQuestionId =
        questionID == link.question1_id ? link.question2_id : link.question1_id;
      const otherQuestion = await ClientPostsApi.getQuestion(otherQuestionId);
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
