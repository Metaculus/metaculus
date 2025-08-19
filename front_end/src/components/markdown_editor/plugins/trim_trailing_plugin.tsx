"use client";

import { realmPlugin, createRootEditorSubscription$ } from "@mdxeditor/editor";
import { $getRoot, $isParagraphNode } from "lexical";

export const trimTrailingParagraphPlugin = realmPlugin({
  init(realm) {
    realm.pub(createRootEditorSubscription$, (editor) => {
      const trim = () => {
        editor.update(() => {
          const root = $getRoot();
          const children = root.getChildren();
          if (children.length <= 1) return;

          const last = children[children.length - 1];
          if ($isParagraphNode(last)) {
            const text = last
              .getTextContent()
              .replace(/\u200B/g, "")
              .trim();
            if (text === "" && last.getChildrenSize() <= 1) {
              last.remove();
            }
          }
        });
      };

      trim();
      return editor.registerUpdateListener(() => {
        trim();
      });
    });
  },
});
