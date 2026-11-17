import {
  $createGenericHTMLNode,
  addImportVisitor$,
  isMdastHTMLNode,
  MdastHTMLNode,
  MdastImportVisitor,
  realmPlugin,
} from "@mdxeditor/editor";

import { isSafeHtmlAttribute, SAFE_EDITOR_HTML_TAGS } from "@/utils/markdown";

type MdxJsxAttribute = Extract<
  MdastHTMLNode["attributes"][number],
  { type: "mdxJsxAttribute" }
>;

// MDXEditor's GenericHTMLNode copies every attribute onto a live DOM element,
// so this import step, not the string-level preprocessing, is the trust boundary.
function getSafeHtmlAttributes(node: MdastHTMLNode): MdxJsxAttribute[] {
  return node.attributes.filter(
    (attribute): attribute is MdxJsxAttribute =>
      attribute.type === "mdxJsxAttribute" &&
      (attribute.value === null || typeof attribute.value === "string") &&
      isSafeHtmlAttribute(node.name, attribute.name, attribute.value ?? "")
  );
}

const MdastSafeHTMLVisitor: MdastImportVisitor<MdastHTMLNode> = {
  testNode: isMdastHTMLNode,
  visitNode({ mdastNode, actions, lexicalParent }) {
    if (!SAFE_EDITOR_HTML_TAGS.has(mdastNode.name)) {
      actions.visitChildren(mdastNode, lexicalParent);
      return;
    }

    const attributes = getSafeHtmlAttributes(mdastNode);
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
  // Runs before MDXEditor's own MdastHTMLVisitor (-100)
  priority: -50,
};

export const safeHtmlPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addImportVisitor$]: MdastSafeHTMLVisitor,
    });
  },
});
