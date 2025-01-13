"use client";
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";

import { createForecasts, getPost } from "@/app/(main)/questions/actions";
import { ForecastPayload } from "@/services/questions";
import { PostWithForecasts } from "@/types/post";

export type ReaffirmStatus = "idle" | "loading" | "completed";

type CardReaffirmContext = {
  reaffirmStatus?: ReaffirmStatus;
  onReaffirm?: (userForecast: ForecastPayload[]) => void;
};

const CardReaffirmContext = createContext({} as CardReaffirmContext);

type ProviderProps = {
  post: PostWithForecasts;
  onPostChanged: (post: PostWithForecasts) => void;
};

export const CardReaffirmContextProvider: FC<
  PropsWithChildren<ProviderProps>
> = ({ post, onPostChanged, children }) => {
  const [status, setStatus] = useState<ReaffirmStatus>("idle");

  // submit reaffirmed forecast and update the post
  const handleReaffirm = useCallback(
    async (userForecast: ForecastPayload[]) => {
      setStatus("idle");
      if (!userForecast.length) {
        return;
      }

      setStatus("loading");
      await createForecasts(post.id, userForecast, false);
      const postResponse = await getPost(post.id);
      onPostChanged(postResponse);
      setStatus("completed");
    },
    [onPostChanged, post.id]
  );

  return (
    <CardReaffirmContext.Provider
      value={{ reaffirmStatus: status, onReaffirm: handleReaffirm }}
    >
      {children}
    </CardReaffirmContext.Provider>
  );
};

export default function useCardReaffirmContext(): CardReaffirmContext {
  return useContext(CardReaffirmContext);
}
