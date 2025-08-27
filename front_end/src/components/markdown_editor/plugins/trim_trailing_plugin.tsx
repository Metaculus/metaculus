"use client";

import { realmPlugin, createRootEditorSubscription$ } from "@mdxeditor/editor";
import { $getRoot, $isParagraphNode, DecoratorNode } from "lexical";

export const trimTrailingParagraphPlugin = realmPlugin({
  init(realm) {
    realm.pub(createRootEditorSubscription$, (editor) => {
      let running = false;
      const trim = () => {
        if (running) return;
        running = true;
        editor.update(() => {
          const root = $getRoot();
          const children = root.getChildren();
          if (children.length <= 1) return;

          const last = children[children.length - 1];
          if (!$isParagraphNode(last)) return;

          const prev = last.getPreviousSibling();
          if (prev instanceof DecoratorNode) return;

          const text = last
            .getTextContent()
            .replace(/\u200B/g, "")
            .trim();
          const isEffectivelyEmpty = text === "" && last.getChildrenSize() <= 1;
          if (isEffectivelyEmpty) last.remove();
        });
        running = false;
      };

      trim();
      return editor.registerUpdateListener(() => {
        trim();
      });
    });
  },
});
