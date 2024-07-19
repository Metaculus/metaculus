import { $isLinkNode, LinkNode } from "@lexical/link";
import { LexicalExportVisitor } from "@mdxeditor/editor";
import * as Mdast from "mdast";

export const LexicalLinkVisitor: LexicalExportVisitor<LinkNode, Mdast.Link> = {
  testLexicalNode: $isLinkNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto("link", {
      url: lexicalNode.getURL(),
      title: lexicalNode.getTitle(),
    });
  },
};
