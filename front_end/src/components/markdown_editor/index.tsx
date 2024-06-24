"use client";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
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
import React, { FC, useMemo, useRef } from "react";

import "@mdxeditor/editor/style.css";

import {
  embeddedQuestionDescriptor,
  EmbedQuestionAction,
} from "./embedded_question";

type EditorMode = "default" | "extended" | "readOnly";

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  embeddedQuestionDescriptor,
];

type Props = {
  markdown: string;
  mode?: EditorMode;
};

const MarkdownEditor: FC<Props> = ({ markdown, mode = "default" }) => {
  const editorRef = useRef<MDXEditorMethods>(null);

  const editorDiffSourcePlugin = useMemo(() => {
    if (mode === "extended") {
      return diffSourcePlugin({
        viewMode: "source",
      });
    }

    return null;
  }, [mode]);

  const editorToolbarPlugin = useMemo(() => {
    const Controls = (
      <>
        <UndoRedo />
        <BlockTypeSelect />
        <BoldItalicUnderlineToggles />
        <CreateLink />
        <EmbedQuestionAction />
      </>
    );

    switch (mode) {
      case "readOnly":
        return null;
      case "extended":
        return toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper options={["rich-text", "source"]}>
              {Controls}
            </DiffSourceToggleWrapper>
          ),
        });
      default:
        return toolbarPlugin({
          toolbarContents: () => <>{Controls}</>,
        });
    }
  }, [mode]);

  return (
    <MDXEditor
      ref={editorRef}
      className="content"
      markdown={markdown}
      onChange={console.log}
      readOnly={mode === "readOnly"}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        linkPlugin(),
        quotePlugin(),
        markdownShortcutPlugin(),
        thematicBreakPlugin(),
        linkDialogPlugin(),
        jsxPlugin({ jsxComponentDescriptors }),
        ...(editorDiffSourcePlugin ? [editorDiffSourcePlugin] : []),
        ...(editorToolbarPlugin ? [editorToolbarPlugin] : []),
      ]}
    />
  );
};

export default MarkdownEditor;
