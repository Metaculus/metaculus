"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  addComposerChild$,
  insertCodeBlock$,
  realmPlugin,
  usePublisher,
} from "@mdxeditor/editor";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  KEY_DOWN_COMMAND,
} from "lexical";
import { useEffect } from "react";

import { normalizeLang } from "./languages";

function CodeFenceShortcut() {
  const [editor] = useLexicalComposerContext();
  const insertCode = usePublisher(insertCodeBlock$);

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (event.key !== "Enter") return false;

        let handled = false;

        editor.update(() => {
          const sel = $getSelection();
          if (!$isRangeSelection(sel) || !sel.isCollapsed()) return;

          const fencePara = sel.anchor.getNode().getTopLevelElementOrThrow();
          const text = fencePara.getTextContent().trim();
          const m = text.match(/^```([a-z0-9+-]*)?$/i);
          if (!m) return;

          event.preventDefault();

          const lang = normalizeLang(m[1]);
          insertCode({ language: lang, code: "" });
          if (fencePara.isAttached()) fencePara.remove();
          handled = true;
        });

        return handled;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, insertCode]);

  return null;
}

export const codeFenceShortcutPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addComposerChild$]: () => <CodeFenceShortcut />,
    });
  },
});
