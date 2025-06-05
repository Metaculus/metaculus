import { StaticImageData } from "next/image";
import { ReactNode } from "react";

export type ProForecaster = {
  id: string;
  name: string;
  description: ReactNode;
  rawDescription: string;
  linkedInUrl: string | null;
  image: StaticImageData;
};
