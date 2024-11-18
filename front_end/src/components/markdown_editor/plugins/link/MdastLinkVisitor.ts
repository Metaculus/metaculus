import { $createLinkNode } from "@lexical/link";
import { MdastImportVisitor } from "@mdxeditor/editor";
import * as Mdast from "mdast";

export const createMdastLinkVisitor = (
  withUgcLinks: boolean
): MdastImportVisitor<Mdast.Link> => ({
  testNode: "link",
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto(
      $createLinkNode(mdastNode.url, {
        title: mdastNode.title,
        target: "_blank",
        ...(withUgcLinks ? { rel: "ugc" } : {}),
      })
    );
  },
});
