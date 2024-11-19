import {
  addComposerChild$,
  addExportVisitor$,
  addLexicalNode$,
  realmPlugin,
} from "@mdxeditor/editor";
import {
  BeautifulMentionsPlugin,
  PlaceholderNode,
  createBeautifulMentionNode,
} from "lexical-beautiful-mentions";

import CustomMentionComponent from "./components/mention";
import { Menu, MenuItem } from "./components/menu";
import { LexicalBeautifulMentionVisitor } from "./LexicalBeautifulMentionVisitor";
import { queryMentions } from "./utils";

export const mentionsPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addLexicalNode$]: [
        ...createBeautifulMentionNode(CustomMentionComponent),
        PlaceholderNode,
      ],
      [addExportVisitor$]: LexicalBeautifulMentionVisitor,
      [addComposerChild$]: () => (
        <BeautifulMentionsPlugin
          triggers={["@"]}
          onSearch={queryMentions}
          menuComponent={Menu}
          menuItemComponent={MenuItem}
        />
      ),
    });
  },
});
