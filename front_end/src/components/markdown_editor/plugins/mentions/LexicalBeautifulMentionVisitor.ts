import { LexicalExportVisitor } from "@mdxeditor/editor";
import {
  $isBeautifulMentionNode,
  BeautifulMentionNode,
} from "lexical-beautiful-mentions";
import * as Mdast from "mdast";

export const LexicalBeautifulMentionVisitor: LexicalExportVisitor<
  BeautifulMentionNode,
  Mdast.Link
> = {
  testLexicalNode: $isBeautifulMentionNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    const value = lexicalNode.getValue();

    actions.addAndStepInto("text", {
      value: `@${value}`,
    });
  },
};
