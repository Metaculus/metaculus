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
  MDXEditorMethods,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import React, { FC, useRef } from "react";

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
  inlineJsxEmbeds?: boolean;
};

const MarkdownEditor: FC<Props> = ({
  markdown,
  readOnly = false,
  inlineJsxEmbeds = false,
}) => {
  const editorRef = useRef<MDXEditorMethods>(null);

  const handleInlineJsxEmbeds = (markdown: string) => {
    const { cleanedMarkdown, wasUpdated } = removeBackslashFromJSX(markdown);
    if (wasUpdated && editorRef.current) {
      editorRef.current.setMarkdown(cleanedMarkdown);
    }
  };

  return (
    <MDXEditor
      ref={editorRef}
      className="content"
      markdown={markdown}
      onChange={(markdown) => {
        if (inlineJsxEmbeds) {
          handleInlineJsxEmbeds(markdown);
        }

        console.log("markdown", markdown);
      }}
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

function removeBackslashFromJSX(markdown: string): {
  cleanedMarkdown: string;
  wasUpdated: boolean;
} {
  const regex = /\\(<[a-zA-Z][^>]*>)/g;

  const wasUpdated = regex.test(markdown);
  const cleanedMarkdown = markdown.replace(regex, "$1");

  return { cleanedMarkdown, wasUpdated };
}

export default MarkdownEditor;
