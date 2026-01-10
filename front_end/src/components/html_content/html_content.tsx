"use client";
import parse, { domToReact } from "html-react-parser";
import type { DOMNode, Element } from "html-react-parser";
import { FC, Fragment, ReactNode, useRef } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import cn from "@/utils/core/cn";
import { sanitizeHtmlContent } from "@/utils/markdown";

const TOGGLE_CHILDREN_LOOKUP_LIMIT = 10;

type Props = {
  content: string;
  className?: string;
  allowStyleTag?: boolean;
};

const HtmlContent: FC<Props> = ({ content, className, allowStyleTag }) => {
  const toggleKey = useRef<string | null>(null);
  const clearContent = sanitizeHtmlContent(content, { allowStyleTag });

  const transform = (node: DOMNode, index: number) => {
    const el = node as Element;
    if (!el.attribs) return undefined;

    if (el.attribs["toggle-details"]) {
      toggleKey.current = el.attribs["toggle-details"];

      const titleCandidate = domToReact(el.children as DOMNode[]);
      const title = typeof titleCandidate === "string" ? titleCandidate : "";

      const contentNodes: ReactNode[] = [];
      let sibling = el.next;
      let safetyCounter = 0;

      while (sibling && safetyCounter < TOGGLE_CHILDREN_LOOKUP_LIMIT) {
        const sibEl = sibling as Element;
        if (sibEl.attribs?.["ng-show"] === toggleKey.current) {
          contentNodes.push(domToReact([sibEl]));
          break;
        }

        if (sibEl.attribs?.["toggle-details"]) break;

        sibling = sibEl.next;
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
          <SectionToggle key={`section-toggle-${index}`} title={title}>
            {contentNodes.map((node, nodeIndex) => (
              <Fragment key={`section-${index}-node-${nodeIndex}`}>
                {node}
              </Fragment>
            ))}
          </SectionToggle>
        </div>
      );
    }

    if (el.attribs?.["ng-show"] === toggleKey.current) {
      toggleKey.current = null;
      return <></>;
    }

    return undefined;
  };

  return (
    <div className={cn("content", className)}>
      {parse(clearContent, { replace: transform })}
    </div>
  );
};

export default HtmlContent;
