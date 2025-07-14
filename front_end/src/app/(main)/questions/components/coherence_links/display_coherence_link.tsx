import { FC } from "react";

import { CoherenceLink } from "@/types/coherence";
type Props = {
  link: CoherenceLink;
};
export const DisplayCoherenceLink: FC<Props> = ({ link }) => {
  return <div>{JSON.stringify(link)}</div>;
};
