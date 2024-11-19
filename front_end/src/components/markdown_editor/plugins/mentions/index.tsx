import {
  addComposerChild$,
  addExportVisitor$,
  addLexicalNode$,
  addNestedEditorChild$,
  LexicalExportVisitor,
  realmPlugin,
} from "@mdxeditor/editor";
import {
  $isBeautifulMentionNode,
  BeautifulMentionsPlugin,
  BeautifulMentionNode,
  PlaceholderNode,
  BeautifulMentionComponentProps,
  createBeautifulMentionNode,
} from "lexical-beautiful-mentions";
import * as Mdast from "mdast";
import { forwardRef } from "react";

type MentionData = {
  id: number;
};

const CustomMentionComponent = forwardRef<
  HTMLAnchorElement,
  BeautifulMentionComponentProps<MentionData>
>(({ trigger, value, data: myData, children, ...other }, ref) => {
  return (
    <a {...other} ref={ref} href={myData ? `/profile/${myData.id}` : "#"}>
      {value}
    </a>
  );
});
CustomMentionComponent.displayName = "CustomMentionComponent";

const LexicalBeautifulMentionVisitor: LexicalExportVisitor<
  BeautifulMentionNode,
  Mdast.Link
> = {
  testLexicalNode: $isBeautifulMentionNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    const value = lexicalNode.getValue();
    actions.addAndStepInto("text", { value: `@(${value})` });
    // actions.addAndStepInto("link", {
    //   url: `/profile/${data.id}`,
    //   title: value,
    //   children: [{ type: "text", value: "alpha" }],
    // });
  },
};

export const mentionsPlugin = realmPlugin({
  init(realm) {
    const mentionItems = {
      "@": [
        { value: "John", id: 1 },
        { value: "Jane", id: 2 },
        { value: "Joe", id: 3 },
      ],
    };

    realm.pubIn({
      [addLexicalNode$]: [
        ...createBeautifulMentionNode(CustomMentionComponent),
        PlaceholderNode,
      ],
      [addExportVisitor$]: LexicalBeautifulMentionVisitor,
      [addComposerChild$]: () => (
        <BeautifulMentionsPlugin items={mentionItems} />
      ),
      [addNestedEditorChild$]: () => (
        <BeautifulMentionsPlugin items={mentionItems} />
      ),
    });
  },
});
