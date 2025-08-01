"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import ClientCoherenceLinksApi from "@/services/api/coherence_links/coherence_links.client";
import { CoherenceLinksGroup } from "@/types/coherence";
import { Post } from "@/types/post";

type BaseProviderProps = {
  post: Post;
};

export type CoherenceLinksContextType = {
  coherenceLinks: CoherenceLinksGroup;
  updateCoherenceLinks: () => Promise<void>;
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

  return (
    <CoherenceLinksContext.Provider
      value={{ coherenceLinks, updateCoherenceLinks }}
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
