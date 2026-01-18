import {
  addComposerChild$,
  addExportVisitor$,
  addLexicalNode$,
  realmPlugin,
} from "@mdxeditor/editor";
import {
  PlaceholderNode,
  createBeautifulMentionNode,
} from "lexical-beautiful-mentions";

import { ProjectPermissions } from "@/types/post";

import CustomMentionComponent from "./components/mention";
import MentionsPlugin from "./components/plugin";
import { LexicalBeautifulMentionVisitor } from "./LexicalBeautifulMentionVisitor";

export const mentionsPlugin = realmPlugin<{
  initialMention?: string;
  userPermission?: ProjectPermissions;
}>({
  init(realm, params) {
    realm.pubIn({
      [addLexicalNode$]: [
        ...createBeautifulMentionNode(CustomMentionComponent),
        PlaceholderNode,
      ],
      [addExportVisitor$]: LexicalBeautifulMentionVisitor,
      [addComposerChild$]: () => (
        <MentionsPlugin
          initialMention={params?.initialMention}
          userPermission={params?.userPermission}
        />
      ),
    });
  },
});
