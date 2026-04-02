import { ImpactDirection, KeyFactor } from "@/types/comment";

export type NewsAnnotation = {
  keyFactor: KeyFactor;
  timestamp: number;
  title: string;
  source: string;
  imgUrl?: string;
  url?: string;
  direction: ImpactDirection | null;
  strength: number;
};

export type AnnotationCluster = {
  timestamp: number;
  xPixel: number;
  annotations: NewsAnnotation[];
};
