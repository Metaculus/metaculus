"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { addComposerChild$, realmPlugin } from "@mdxeditor/editor";
import { useEffect } from "react";

// Minified Lexical errors that are transient and recoverable via state rollback.
// See https://lexical.dev/docs/error?code=<N> for descriptions.
const TRANSIENT_ERROR_CODES = new Set([
  20, // Point.getNode: node not found (stale selection reference)
  62, // updateEditor: selection lost after node removal
]);

function isTransientLexicalError(error: Error): boolean {
  const match = error.message.match(/Lexical error #(\d+)/);
  if (match) return TRANSIENT_ERROR_CODES.has(Number(match[1]));
  return error.message.includes("node not found");
}

/**
 * MDXEditor hardcodes `onError: (error) => { throw error }` in the Lexical
 * editor config. This causes transient Lexical errors (e.g. error #20 —
 * "Point.getNode: node not found") to escape the internal try/catch and
 * propagate as unhandled errors. This plugin patches `_onError` to suppress
 * known transient errors in production, letting Lexical's own recovery
 * (state rollback) work. Unknown errors are delegated to the previous handler.
 */
function ErrorRecovery() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const prev = editor._onError;
    editor._onError = (error: Error) => {
      if (
        process.env.NODE_ENV !== "production" ||
        !isTransientLexicalError(error)
      ) {
        prev(error);
        return;
      }
      console.warn("[Lexical]", error.message);
    };
    return () => {
      editor._onError = prev;
    };
  }, [editor]);

  return null;
}

export const errorRecoveryPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addComposerChild$]: () => <ErrorRecovery />,
    });
  },
});
