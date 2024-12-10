import { StaticImageData } from "next/image";

export type ProForecaster = {
  id: string;
  name: string;
  description: string;
  linkedInUrl: string | null;
  image: StaticImageData;
};
