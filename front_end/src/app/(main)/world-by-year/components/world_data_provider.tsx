"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";

import { WorldQuestion } from "../data/questions";
import { buildWorldModel, WorldModel } from "../helpers/world_model";

const WorldDataContext = createContext<WorldModel | null>(null);

export const WorldDataProvider: FC<
  PropsWithChildren<{ questions: WorldQuestion[] }>
> = ({ questions, children }) => {
  const model = useMemo(() => buildWorldModel(questions), [questions]);

  return (
    <WorldDataContext.Provider value={model}>
      {children}
    </WorldDataContext.Provider>
  );
};

export const useWorldData = () => {
  const context = useContext(WorldDataContext);
  if (!context) {
    throw new Error("useWorldData must be used within WorldDataProvider");
  }
  return context;
};
