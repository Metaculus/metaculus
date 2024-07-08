import * as Mdast from "mdast";
import { Node } from "unist";

import {
  $createMathJaxNode,
  MathJaxNode,
} from "@/components/markdown_editor/plugins/math-jax/MathJaxNode";

export const MdastMathJaxVisitor = () => ({
  type: "visitor",
  nodeType: "text",
  visit(node: Node) {
    const value = (node as Mdast.Text).value;
    const MATHJAX_REGEX = /(\$\$[^$]*\$\$|\$[^$]*\$)/g;

    const matches = value.match(MATHJAX_REGEX);
    if (matches) {
      const content = matches[0].replace(/^\$/, "").replace(/\$$/, "");
      return $createMathJaxNode({ type: "text", value: content });
    }
    return null;
  },
});

export const LexicalMathJaxVisitor = () => ({
  type: "visitor",
  nodeType: MathJaxNode.getType(),
  visit(node: MathJaxNode) {
    return {
      type: "text",
      value: `$${node.getMdastNode().value}$`,
    };
  },
});
