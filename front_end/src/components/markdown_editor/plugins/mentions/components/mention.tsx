import { BeautifulMentionComponentProps } from "lexical-beautiful-mentions";
import { forwardRef, useEffect } from "react";

import { logErrorWithScope } from "@/utils/errors";

import { MentionData } from "../types";
import { generateMentionLink } from "../utils";

const CustomMentionComponent = forwardRef<
  HTMLAnchorElement,
  BeautifulMentionComponentProps<MentionData>
>(({ trigger, value, data: myData, children, ...other }, ref) => {
  const mentionLink = generateMentionLink(value, myData);

  useEffect(() => {
    if (!mentionLink) {
      logErrorWithScope(
        new Error("Mention link is not generated"),
        { value, myData },
        "Couldn't generate mention link"
      );
    }
  }, [mentionLink, myData, value]);

  if (!mentionLink) {
    return null;
  }

  return (
    <a {...other} ref={ref} href={mentionLink} target="_blank">
      {trigger + value}
    </a>
  );
});
CustomMentionComponent.displayName = "CustomMentionComponent";

export default CustomMentionComponent;
