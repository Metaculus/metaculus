"use client";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  InsertThematicBreak,
  JsxComponentDescriptor,
  jsxPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  MDXEditorMethods,
  quotePlugin,
  Separator,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import classNames from "classnames";
import React, { FC, useMemo, useRef } from "react";

import "@mdxeditor/editor/style.css";

import { uploadImage } from "@/app/(main)/questions/actions";
import useAppTheme from "@/hooks/use_app_theme";

import {
  embeddedQuestionDescriptor,
  EmbedQuestionAction,
} from "./embedded_question";

import "./editor.css";

type EditorMode = "write" | "read";

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  embeddedQuestionDescriptor,
];

type Props = {
  markdown: string;
  mode?: EditorMode;
  onChange?: (markdown: string) => void;
  contentEditableClassName?: string;
};

const MarkdownEditor: FC<Props> = ({
  markdown,
  mode = "read",
  onChange = console.log,
  contentEditableClassName,
}) => {
  const { theme } = useAppTheme();

  const editorRef = useRef<MDXEditorMethods>(null);

  const baseFormattingPlugins = [
    headingsPlugin(),
    listsPlugin(),
    linkPlugin(),
    quotePlugin(),
    markdownShortcutPlugin(),
    thematicBreakPlugin(),
    linkDialogPlugin(),
    imagePlugin({
      disableImageSettingsButton: true,
      disableImageResize: true,
      imageUploadHandler,
    }),
  ];

  const editorDiffSourcePlugin = useMemo(() => {
    if (mode === "read") return null;

    return diffSourcePlugin({
      viewMode: "rich-text",
    });
  }, [mode]);

  const editorToolbarPlugin = useMemo(() => {
    if (mode === "read") return null;

    return toolbarPlugin({
      toolbarContents: () => (
        <DiffSourceToggleWrapper options={["rich-text", "source"]}>
          <UndoRedo />
          <Separator />
          <BlockTypeSelect />
          <BoldItalicUnderlineToggles />
          <Separator />
          <CreateLink />
          <InsertImage />
          <InsertThematicBreak />
          <Separator />
          <EmbedQuestionAction />
        </DiffSourceToggleWrapper>
      ),
    });
  }, [mode]);

  async function imageUploadHandler(image: File) {
    const formData = new FormData();
    formData.append("image", image);
    const response = await uploadImage(formData);
    if ("errors" in response) {
      console.error(response.errors);
      return Promise.reject(response.errors);
    } else {
      return response.url;
    }
  }

  return (
    <MDXEditor
      ref={editorRef}
      className={classNames("content markdown-editor", {
        "dark-theme": theme === "dark",
      })}
      contentEditableClassName={classNames(
        { "!p-0": mode === "read" },
        contentEditableClassName
      )}
      markdown={markdown}
      onChange={onChange}
      readOnly={mode === "read"}
      plugins={[
        ...baseFormattingPlugins,
        jsxPlugin({ jsxComponentDescriptors }),
        ...(editorDiffSourcePlugin ? [editorDiffSourcePlugin] : []),
        ...(editorToolbarPlugin ? [editorToolbarPlugin] : []),
      ]}
    />
  );
};

export default MarkdownEditor;
