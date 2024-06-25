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

import useAppTheme from "@/hooks/use_app_theme";

import {
  embeddedQuestionDescriptor,
  EmbedQuestionAction,
} from "./embedded_question";

import "./editor.css";

type EditorMode = "default" | "extended" | "readOnly";

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
  mode = "default",
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
  ];
  const extendedFormattingPlugins = [
    linkDialogPlugin(),
    imagePlugin({
      disableImageSettingsButton: true,
      disableImageResize: true,
      imageUploadHandler,
    }),
  ];

  const editorDiffSourcePlugin = useMemo(() => {
    if (mode === "readOnly") return null;

    return diffSourcePlugin({
      viewMode: "rich-text",
    });
  }, [mode]);

  const editorToolbarPlugin = useMemo(() => {
    if (mode === "readOnly") return null;

    return toolbarPlugin({
      toolbarContents: () => (
        <DiffSourceToggleWrapper options={["rich-text", "source"]}>
          {mode === "extended" && (
            <>
              <UndoRedo />
              <Separator />
              <BlockTypeSelect />
            </>
          )}
          <BoldItalicUnderlineToggles />
          <Separator />
          {mode === "extended" && (
            <>
              <CreateLink />
              <InsertImage />
            </>
          )}
          <InsertThematicBreak />
          <Separator />
          <EmbedQuestionAction />
        </DiffSourceToggleWrapper>
      ),
    });
  }, [mode]);

  async function imageUploadHandler(image: File) {
    // TODO: integrate BE endpoint once it's ready
    // const formData = new FormData();
    // formData.append("image", image);
    // const response = await fetch("/uploads/new", {
    //   method: "POST",
    //   body: formData,
    // });
    // const json = (await response.json()) as { url: string };
    // return json.url;

    return Promise.resolve("https://picsum.photos/200/300");
  }

  return (
    <MDXEditor
      ref={editorRef}
      className={classNames("content markdown-editor", {
        "dark-theme": theme === "dark",
      })}
      contentEditableClassName={classNames(
        { "!p-0": mode === "readOnly" },
        contentEditableClassName
      )}
      markdown={markdown}
      onChange={onChange}
      readOnly={mode === "readOnly"}
      plugins={[
        ...baseFormattingPlugins,
        ...(mode === "extended" || mode === "readOnly"
          ? extendedFormattingPlugins
          : []),
        jsxPlugin({ jsxComponentDescriptors }),
        ...(editorDiffSourcePlugin ? [editorDiffSourcePlugin] : []),
        ...(editorToolbarPlugin ? [editorToolbarPlugin] : []),
      ]}
    />
  );
};

export default MarkdownEditor;
