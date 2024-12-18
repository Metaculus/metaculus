"use client";
import parse, { domToReact } from "html-react-parser";
import { FC, ReactNode, useRef } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import cn from "@/utils/cn";

const TOGGLE_CHILDREN_LOOKUP_LIMIT = 10;

type Props = {
  content: string;
  className?: string;
};

const HtmlContent: FC<Props> = ({ content, className }) => {
  const toggleKey = useRef<string | null>(null);

  const transform = (node: any) => {
    if (!node.attribs) return undefined;

    if (node.attribs["toggle-details"]) {
      toggleKey.current = node.attribs["toggle-details"];

      const titleCandidate = domToReact(node.children);
      const title = typeof titleCandidate === "string" ? titleCandidate : "";

      const contentNodes: ReactNode[] = [];
      let sibling = node.next;
      let safetyCounter = 0;

      while (sibling && safetyCounter < TOGGLE_CHILDREN_LOOKUP_LIMIT) {
        if (sibling.attribs?.["ng-show"] === toggleKey.current) {
          contentNodes.push(domToReact([sibling]));
          break;
        }

        if (sibling.attribs?.["toggle-details"]) break;

        sibling = sibling.next;
        safetyCounter++;
      }

      if (contentNodes.length === 0) {
        console.warn(
          `No matching content found for toggle key: ${toggleKey.current}`
        );
        return null;
      }

      return (
        <div className="my-2.5">
          <SectionToggle title={title}>{contentNodes}</SectionToggle>
        </div>
      );
    }

    if (node.attribs?.["ng-show"] === toggleKey.current) {
      toggleKey.current = null;
      return <></>;
    }

    return undefined;
  };

  return (
    <div className={cn("content", className)}>
      {parse(content, { replace: transform })}
    </div>
  );
};

export default HtmlContent;
