import { voidEmitter } from "@mdxeditor/editor";
import katex from "katex";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $applyNodeReplacement, DecoratorNode, DOMExportOutput } from "lexical";
import { InlineMath, Math } from "mdast-util-math";
import type { JSX } from "react";

import EquationComponent from "./components/equation_component";

/**
 * A serialized representation of a {@link EquationNode}.
 * @group Equation
 */
export type SerializedEquationNode = Spread<
  {
    equation: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

function $convertEquationElement(
  domNode: HTMLElement
): null | DOMConversionOutput {
  let equation = domNode.getAttribute("data-lexical-equation");
  const inline = domNode.getAttribute("data-lexical-inline") === "true";
  // Decode the equation from base64
  equation = atob(equation || "");
  if (equation) {
    const node = $createEquationNode(equation, inline);
    return { node };
  }

  return null;
}

/**
 * A Lexical node that represents a markdown math equation.
 * Use {@link $createEquationNode} to construct one.
 * @group Equation
 */
export class EquationNode extends DecoratorNode<JSX.Element> {
  __equation: string;
  __inline: boolean;

  __focusEmitter = voidEmitter();

  static getType(): string {
    return "equation";
  }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key);
  }

  /**
   * Constructs a new {@link EquationNode} with the specified MDAST math node as the object to edit.
   * See {@link https://github.com/syntax-tree/mdast-util-math | https://github.com/micromark/micromark-extension-math} for more information on the MDAST math node.
   */
  constructor(equation: string, inline?: boolean, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline ?? false;
  }

  static importJSON(serializedNode: SerializedEquationNode): EquationNode {
    const node = $createEquationNode(
      serializedNode.equation,
      serializedNode.inline
    );
    return node;
  }

  exportJSON(): SerializedEquationNode {
    return {
      equation: this.getEquation(),
      inline: this.__inline,
      type: this.getType(),
      version: 1,
    };
  }

  /**
   * Returns the mdast node that this node is constructed from.
   */
  getMdastNode(): Math | InlineMath {
    if (this.__inline) {
      return { type: "inlineMath", value: this.__equation };
    }

    return { type: "math", value: this.__equation };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const element = document.createElement(this.__inline ? "span" : "div");
    // EquationNodes should implement `user-action:none` in their CSS to avoid issues with deletion on Android.
    element.className = "editor-equation";
    return element;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement(this.__inline ? "span" : "div");
    // Encode the equation as base64 to avoid issues with special characters
    const equation = btoa(this.__equation);
    element.setAttribute("data-lexical-equation", equation);
    element.setAttribute("data-lexical-inline", `${this.__inline}`);
    katex.render(this.__equation, element, {
      displayMode: !this.__inline, // true === block display //
      errorColor: "#cc0000",
      output: "html",
      strict: "warn",
      throwOnError: false,
      trust: false,
    });
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-equation")) {
          return null;
        }
        return {
          conversion: $convertEquationElement,
          priority: 2,
        };
      },
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-equation")) {
          return null;
        }
        return {
          conversion: $convertEquationElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(prevNode: this): boolean {
    // If the inline property changes, replace the element
    return this.__inline !== prevNode.__inline;
  }

  getTextContent(): string {
    return this.__equation;
  }

  getEquation(): string {
    return this.__equation;
  }

  setEquation(equation: string): void {
    const writable = this.getWritable();
    writable.__equation = equation;
  }

  decorate(parentEditor: LexicalEditor): JSX.Element {
    return (
      <EquationComponent
        equation={this.__equation}
        inline={this.__inline}
        nodeKey={this.__key}
        parentEditor={parentEditor}
        focusEmitter={this.__focusEmitter}
      />
    );
  }

  select() {
    this.__focusEmitter.publish();
  }
}

/**
 * Creates a {@link EquationNode}. Use this instead of the constructor to follow the Lexical conventions.
 * @param equation - Math expression.
 * @param inline - Whether the equation should be displayed inline.
 * @group Equation
 */
export function $createEquationNode(
  equation = "",
  inline = false
): EquationNode {
  const equationNode = new EquationNode(equation, inline);
  return $applyNodeReplacement(equationNode);
}

/**
 * Returns true if the given node is a {@link EquationNode}.
 * @group Equation
 */
export function $isEquationNode(
  node: LexicalNode | null | undefined
): node is EquationNode {
  return node instanceof EquationNode;
}
