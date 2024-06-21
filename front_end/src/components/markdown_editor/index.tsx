"use client";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  headingsPlugin,
  JsxComponentDescriptor,
  jsxPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import React, { FC } from "react";

import "@mdxeditor/editor/style.css";

import {
  embeddedQuestionDescriptor,
  EmbedQuestionAction,
} from "./embedded_question";

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  embeddedQuestionDescriptor,
];

type Props = {
  markdown: string;
  readOnly?: boolean;
};

const MarkdownEditor: FC<Props> = ({ markdown, readOnly = false }) => {
  return (
    <MDXEditor
      className="content"
      markdown={markdown}
      onChange={console.log}
      readOnly={readOnly}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        linkPlugin(),
        quotePlugin(),
        markdownShortcutPlugin(),
        thematicBreakPlugin(),
        linkDialogPlugin(),
        jsxPlugin({ jsxComponentDescriptors }),
        ...(readOnly
          ? []
          : [
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <BlockTypeSelect />
                    <BoldItalicUnderlineToggles />
                    <CreateLink />
                    <EmbedQuestionAction />
                  </>
                ),
              }),
            ]),
      ]}
    />
  );
};

export default MarkdownEditor;
