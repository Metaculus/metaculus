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
  InsertTable,
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
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import classNames from "classnames";
import React, { FC, useEffect, useMemo, useRef } from "react";

import "@mdxeditor/editor/style.css";

import { uploadImage } from "@/app/(main)/questions/actions";
import {
  EmbedMathJaxAction,
  mathJaxDescriptor,
} from "@/components/markdown_editor/embedded_math_jax";
import useAppTheme from "@/hooks/use_app_theme";

import {
  transformMathJax,
  revertMathJaxTransform,
} from "./embedded_math_jax/helpers";
import {
  embeddedQuestionDescriptor,
  EmbedQuestionAction,
} from "./embedded_question";
import "./editor.css";

type EditorMode = "write" | "read";

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  mathJaxDescriptor,
  embeddedQuestionDescriptor,
];

type Props = {
  markdown: string;
  mode?: EditorMode;
  onChange?: (markdown: string) => void;
  contentEditableClassName?: string;
  shouldConfirmLeave?: boolean;
};

const MarkdownEditor: FC<Props> = ({
  markdown,
  mode = "read",
  onChange = console.log,
  contentEditableClassName,
  shouldConfirmLeave = false,
}) => {
  const { theme } = useAppTheme();

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (!shouldConfirmLeave) return;
      e.preventDefault();
    }

    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [shouldConfirmLeave]);

  const editorRef = useRef<MDXEditorMethods>(null);

  // Transform MathJax syntax to JSX embeds to properly utilise the MarkJax renderer
  const formattedMarkdown = useMemo(
    () => transformMathJax(markdown),
    [markdown]
  );

  const baseFormattingPlugins = [
    headingsPlugin(),
    listsPlugin(),
    linkPlugin(),
    quotePlugin(),
    markdownShortcutPlugin(),
    thematicBreakPlugin(),
    linkDialogPlugin(),
    tablePlugin(),
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
          <InsertTable />
          <EmbedMathJaxAction />
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
      markdown={formattedMarkdown}
      onChange={(value) => {
        // Revert the MathJax transformation before passing the markdown to the parent component
        onChange(revertMathJaxTransform(value));
      }}
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
