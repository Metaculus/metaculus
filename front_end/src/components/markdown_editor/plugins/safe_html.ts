import {
  $createGenericHTMLNode,
  addImportVisitor$,
  GenericHTMLNode,
  isMdastHTMLNode,
  MdastHTMLNode,
  MdastImportVisitor,
  realmPlugin,
} from "@mdxeditor/editor";

import { isSafeHtmlAttribute, SAFE_EDITOR_HTML_TAGS } from "@/utils/markdown";

type SafeHtmlAttribute = Extract<
  MdastHTMLNode["attributes"][number],
  { type: "mdxJsxAttribute" }
> & { value: string | null };

function getSafeHtmlAttributes(
  tag: string,
  attributes: MdastHTMLNode["attributes"]
): SafeHtmlAttribute[] {
  return attributes.filter(
    (attribute): attribute is SafeHtmlAttribute =>
      attribute.type === "mdxJsxAttribute" &&
      (attribute.value === null || typeof attribute.value === "string") &&
      isSafeHtmlAttribute(tag, attribute.name, attribute.value ?? "")
  );
}

// Trust boundary for HTML in user Markdown: MDXEditor's GenericHTMLNode copies
// every attribute onto a live element, so tags and attributes are filtered here,
// after all string preprocessing. It only wins because MDXEditor tries import
// visitors highest priority first and its own MdastHTMLVisitor is -100.
// `<img>` and JSX embeds never reach it (imagePlugin and jsxPlugin have their
// own visitors); read_only_image and createJsxComponent guard those instead.
const MdastSafeHTMLVisitor: MdastImportVisitor<MdastHTMLNode> = {
  testNode: isMdastHTMLNode,
  visitNode({ mdastNode, actions, lexicalParent }) {
    if (!SAFE_EDITOR_HTML_TAGS.has(mdastNode.name)) {
      actions.visitChildren(mdastNode, lexicalParent);
      return;
    }

    const attributes = getSafeHtmlAttributes(
      mdastNode.name,
      mdastNode.attributes
    );
    const [onlyAttribute] = attributes;
    if (
      mdastNode.name === "span" &&
      attributes.length === 1 &&
      onlyAttribute?.name === "style" &&
      typeof onlyAttribute.value === "string"
    ) {
      actions.addStyle(onlyAttribute.value, mdastNode);
      actions.visitChildren(mdastNode, lexicalParent);
      return;
    }

    actions.addAndStepInto(
      $createGenericHTMLNode(mdastNode.name, mdastNode.type, attributes)
    );
  },
  priority: -50,
};

// Pasted Lexical clipboard JSON rebuilds GenericHTMLNodes via importJSON without
// any Markdown import, so the same policy is applied where the DOM is created.
GenericHTMLNode.prototype.createDOM = function (this: GenericHTMLNode) {
  const tag = this.getTag();
  if (!SAFE_EDITOR_HTML_TAGS.has(tag)) {
    return document.createElement(this.isInline() ? "span" : "div");
  }

  const element = document.createElement(tag);
  for (const { name, value } of getSafeHtmlAttributes(
    tag,
    this.getAttributes()
  )) {
    element.setAttribute(name, value ?? "");
  }
  return element;
};

export const safeHtmlPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addImportVisitor$]: MdastSafeHTMLVisitor,
    });
  },
});
