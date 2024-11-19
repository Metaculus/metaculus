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
    const data = lexicalNode.getData() as MentionData;

    actions.addAndStepInto(
      "link",
      {
        url: `/accounts/profile/${data.id}`,
        title: null,
        children: [{ type: "text", value: `@${value}` }],
      },
      false
    );
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
