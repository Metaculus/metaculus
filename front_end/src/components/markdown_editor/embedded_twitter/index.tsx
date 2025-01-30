import { JsxComponentDescriptor } from "@mdxeditor/editor";
import { Tweet } from "react-tweet";

import createEditorComponent from "../createJsxComponent";

export const tweetDescriptor: JsxComponentDescriptor = {
  name: "Tweet",
  props: [{ name: "id", type: "string", required: true }],
  kind: "text",
  hasChildren: false,
  Editor: createEditorComponent(Tweet),
};
