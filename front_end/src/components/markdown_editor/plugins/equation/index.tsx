import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addMdastExtension$,
  addSyntaxExtension$,
  addToMarkdownExtension$,
  insertDecoratorNode$,
  map,
  realmPlugin,
  Signal,
} from "@mdxeditor/editor";
import { mathToMarkdown, mathFromMarkdown } from "mdast-util-math";
import { math } from "micromark-extension-math";

import { $createEquationNode, EquationNode } from "./equation_node";
import { LexicalEquationVisitor } from "./lexical_equation_visitor";
import {
  MdastEquationVisitor,
  MdastInlineEquationVisitor,
} from "./mdast_equation_visitor";

export const insertEquation$ = Signal<{
  equation: string;
  inline: boolean;
}>((r) => {
  r.link(
    r.pipe(
      insertEquation$,
      map(({ equation, inline }) => {
        return () => $createEquationNode(equation, inline);
      })
    ),
    insertDecoratorNode$
  );
});

export const equationPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      // import
      [addMdastExtension$]: mathFromMarkdown(),
      [addSyntaxExtension$]: math(),
      [addImportVisitor$]: [MdastEquationVisitor, MdastInlineEquationVisitor],
      // export
      [addLexicalNode$]: EquationNode,
      [addExportVisitor$]: [LexicalEquationVisitor],
      [addToMarkdownExtension$]: mathToMarkdown(),
    });
  },
});
