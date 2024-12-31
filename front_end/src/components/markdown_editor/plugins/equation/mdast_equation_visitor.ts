import { MdastImportVisitor } from "@mdxeditor/editor";
import { InlineMath, Math } from "mdast-util-math";

import { $createEquationNode } from "./equation_node";

export const MdastEquationVisitor: MdastImportVisitor<Math> = {
  testNode: "math",
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createEquationNode(mdastNode.value, false));
  },
};

export const MdastInlineEquationVisitor: MdastImportVisitor<InlineMath> = {
  testNode: "inlineMath",
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createEquationNode(mdastNode.value, true));
  },
};
