import {
  DecoratorNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import * as Mdast from "mdast";
import React from "react";

import MathJaxRenderer from "@/components/markdown_editor/mathjax_renderer";

export type SerializedMathJaxNode = Spread<
  {
    mdastNode: Mdast.Text;
  },
  SerializedLexicalNode
>;

export class MathJaxNode extends DecoratorNode<JSX.Element> {
  __mdastNode: Mdast.Text;

  static getType(): string {
    return "mathjax";
  }

  static clone(node: MathJaxNode): MathJaxNode {
    return new MathJaxNode(structuredClone(node.__mdastNode), node.__key);
  }

  static importJSON(serializedNode: SerializedMathJaxNode): MathJaxNode {
    return $createMathJaxNode(serializedNode.mdastNode);
  }

  exportJSON(): SerializedMathJaxNode {
    return {
      mdastNode: structuredClone(this.__mdastNode),
      type: "mathjax",
      version: 1,
    };
  }

  getMdastNode(): Mdast.Text {
    return this.__mdastNode;
  }

  constructor(mdastNode?: Mdast.Text, key?: NodeKey) {
    super(key);
    this.__mdastNode = mdastNode ?? { type: "text", value: "" };
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): false {
    return false;
  }

  decorate(parentEditor: LexicalEditor): JSX.Element {
    return <MathJaxRenderer content={this.__mdastNode.value} />;
  }
}

export function $isMathJaxNode(
  node: LexicalNode | null | undefined
): node is MathJaxNode {
  return node instanceof MathJaxNode;
}

export function $createMathJaxNode(mdastNode: Mdast.Text): MathJaxNode {
  return new MathJaxNode(mdastNode);
}
