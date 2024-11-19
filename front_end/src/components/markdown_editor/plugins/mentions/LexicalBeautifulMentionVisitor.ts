import { LexicalExportVisitor } from "@mdxeditor/editor";
import {
  $isBeautifulMentionNode,
  BeautifulMentionNode,
} from "lexical-beautiful-mentions";
import * as Mdast from "mdast";

import { MentionData } from "./types";
import { generateMentionLink } from "./utils";

export const LexicalBeautifulMentionVisitor: LexicalExportVisitor<
  BeautifulMentionNode,
  Mdast.Link
> = {
  testLexicalNode: $isBeautifulMentionNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    const value = lexicalNode.getValue();
    const data: MentionData | undefined = lexicalNode.getData();

    actions.addAndStepInto(
      "link",
      {
        url: generateMentionLink(value, data),
        title: null,
        children: [{ type: "text", value: `@${value}` }],
      },
      false
    );
  },
};
