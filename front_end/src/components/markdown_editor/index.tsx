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
};

const MarkdownEditor: FC<Props> = ({ markdown, mode = "default" }) => {
  const { theme } = useAppTheme();

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
        <Separator />
        <BlockTypeSelect />
        <BoldItalicUnderlineToggles />
        <Separator />
        <CreateLink />
        <InsertImage />
        <InsertThematicBreak />
        <Separator />
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
        imagePlugin({
          disableImageSettingsButton: true,
          disableImageResize: true,
          imageUploadHandler,
        }),
        jsxPlugin({ jsxComponentDescriptors }),
        ...(editorDiffSourcePlugin ? [editorDiffSourcePlugin] : []),
        ...(editorToolbarPlugin ? [editorToolbarPlugin] : []),
      ]}
    />
  );
};

export default MarkdownEditor;
