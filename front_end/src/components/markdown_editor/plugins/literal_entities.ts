import {
  addImportVisitor$,
  IS_CODE,
  MdastImportVisitor,
  realmPlugin,
} from "@mdxeditor/editor";
import { Cell } from "@mdxeditor/gurx";
import { $createTextNode } from "lexical";
import { InlineCode } from "mdast";

export type LegacyEntityDecoding = "basic" | "full";

const NBSP = String.fromCharCode(0xa0);

// Reproduces what code and math showed before the safe-rendering fix: `&lt;`,
// `&gt;` and `&amp;` were always decoded, every other reference only when
// DOMPurify had parsed the document ("full"), and U+00A0 came back as `&nbsp;`.
// Callers must use the result as text only, never as Markdown, HTML or a URL.
export function decodeLiteralEntities(
  value: string,
  decoding: LegacyEntityDecoding
): string {
  if (!value.includes("&")) return value;
  if (decoding === "basic") {
    return value
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }

  // Every `<` is escaped first, so the inert parsed document holds only text
  const title = new DOMParser()
    .parseFromString(
      `<title>${value.replace(/</g, "&lt;")}</title>`,
      "text/html"
    )
    .querySelector("title");
  return (title?.textContent ?? value).replaceAll(NBSP, "&nbsp;");
}

export const literalEntityDecoding$ = Cell<LegacyEntityDecoding | null>(null);

// Read mode only: the decoded text lives in a non-editable editor that is never
// exported, so stored Markdown keeps its original entities.
export const literalEntitiesPlugin = realmPlugin<{
  decoding: LegacyEntityDecoding | null;
}>({
  init(realm, params) {
    const MdastInlineCodeVisitor: MdastImportVisitor<InlineCode> = {
      testNode: "inlineCode",
      visitNode({ mdastNode, actions }) {
        const decoding = realm.getValue(literalEntityDecoding$);
        const text = decoding
          ? decodeLiteralEntities(mdastNode.value, decoding)
          : mdastNode.value;
        actions.addAndStepInto(
          $createTextNode(text).setFormat(
            actions.getParentFormatting() | IS_CODE
          )
        );
      },
      // Ahead of MDXEditor's own inline code visitor (priority 0)
      priority: 1,
    };

    realm.pubIn({
      [literalEntityDecoding$]: params?.decoding ?? null,
      [addImportVisitor$]: MdastInlineCodeVisitor,
    });
  },
  update(realm, params) {
    realm.pub(literalEntityDecoding$, params?.decoding ?? null);
  },
});
