import { JsxComponentDescriptor, MdastJsx } from "@mdxeditor/editor";
import { FC } from "react";

const EMBED_ID_REGEX = /^\d{1,20}$/;

// Embed ids become request paths (`/tweet/{id}`, `/posts/{id}/`), so anything
// but plain digits must render nothing rather than reach a fetch.
export const isEmbedId = (id: unknown): id is string =>
  typeof id === "string" && EMBED_ID_REGEX.test(id);

function getEmbedId(node: MdastJsx): string | null {
  const attribute = node.attributes.find(
    (a) => a.type === "mdxJsxAttribute" && a.name === "id"
  );
  if (attribute?.type !== "mdxJsxAttribute") return null;

  const raw =
    typeof attribute.value === "string"
      ? attribute.value
      : attribute.value?.value.trim();
  return isEmbedId(raw) ? raw : null;
}

function createEmbedEditorComponent(
  Component: FC<{ id: string }>
): JsxComponentDescriptor["Editor"] {
  const Editor: JsxComponentDescriptor["Editor"] = ({ mdastNode }) => {
    const id = getEmbedId(mdastNode);
    return id ? <Component id={id} /> : null;
  };
  Editor.displayName = "EmbedEditorComponent";

  return Editor;
}

export default createEmbedEditorComponent;
