import { LexicalExportVisitor } from "@mdxeditor/editor";
import { Math } from "mdast-util-math";

import { $isEquationNode, EquationNode } from "./equation_node";

export const LexicalEquationVisitor: LexicalExportVisitor<EquationNode, Math> =
  {
    testLexicalNode: $isEquationNode,
    visitLexicalNode({ actions, mdastParent, lexicalNode }) {
      actions.appendToParent(mdastParent, lexicalNode.getMdastNode());
    },
  };
