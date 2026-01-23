import { JsxComponentDescriptor } from "@mdxeditor/editor";
import { Tweet } from "react-tweet";

import createEditorComponent from "../createJsxComponent";

export const EMBEDDED_TWITTER_COMPONENT_NAME = "Tweet";

const TweetEmbed: React.FC<{ id: string }> = ({ id }) => {
  return (
    <div className="tweet-embed" data-embed="tweet">
      <div className="tweet-embed-scroll">
        <Tweet id={id} />
      </div>
    </div>
  );
};

export const tweetDescriptor: JsxComponentDescriptor = {
  name: EMBEDDED_TWITTER_COMPONENT_NAME,
  props: [{ name: "id", type: "string", required: true }],
  kind: "text",
  hasChildren: false,
  Editor: createEditorComponent(TweetEmbed),
};
