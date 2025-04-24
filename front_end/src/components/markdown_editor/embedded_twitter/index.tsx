import { JsxComponentDescriptor } from "@mdxeditor/editor";
import { Tweet } from "react-tweet";

import createEditorComponent from "../createJsxComponent";

export const EMBEDDED_TWITTER_COMPONENT_NAME = "Tweet";

export const tweetDescriptor: JsxComponentDescriptor = {
  name: EMBEDDED_TWITTER_COMPONENT_NAME,
  props: [{ name: "id", type: "string", required: true }],
  kind: "text",
  hasChildren: false,
  Editor: createEditorComponent(Tweet),
};
