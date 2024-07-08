import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addMdastExtension$,
  addSyntaxExtension$,
  realmPlugin,
} from "@mdxeditor/editor";

import { MathJaxNode } from "@/components/markdown_editor/plugins/math-jax/MathJaxNode";
import {
  LexicalMathJaxVisitor,
  MdastMathJaxVisitor,
} from "@/components/markdown_editor/plugins/math-jax/MathJaxVisitor";

const mathJaxMdastExtension = () => ({
  enter: {
    text(token: any) {
      const value = token.value;
      const MATHJAX_REGEX = /(\$\$[^$]*\$\$|\$[^$]*\$)/g;

      const matches = value.match(MATHJAX_REGEX);
      if (matches) {
        const content = matches[0].replace(/^\$/, "").replace(/\$$/, "");
        return {
          type: "math",
          value: content,
        };
      }
    },
  },
});

export const mathjaxPlugin = realmPlugin<void>({
  init(realm) {
    realm.pubIn({
      [addImportVisitor$]: MdastMathJaxVisitor(),
      [addExportVisitor$]: LexicalMathJaxVisitor(),
      [addLexicalNode$]: MathJaxNode,
      [addMdastExtension$]: mathJaxMdastExtension(),
      [addSyntaxExtension$]: mathJaxMdastExtension(),
    });
  },
});
