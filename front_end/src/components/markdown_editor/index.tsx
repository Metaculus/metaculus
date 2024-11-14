"use client";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeBlockEditorDescriptor,
  codeBlockPlugin,
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
import dynamic from "next/dynamic";
import React, { FC, useEffect, useMemo, useRef, useState } from "react";

import "@mdxeditor/editor/style.css";

import { uploadImage } from "@/app/(main)/questions/actions";
import {
  EmbedMathJaxAction,
  mathJaxDescriptor,
} from "@/components/markdown_editor/embedded_math_jax";
import { linkPlugin } from "@/components/markdown_editor/plugins/link";
import useAppTheme from "@/hooks/use_app_theme";
import useConfirmPageLeave from "@/hooks/use_confirm_page_leave";
import { logErrorWithScope } from "@/utils/errors";

import {
  revertMathJaxTransform,
  transformMathJax,
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
  className?: string;
};

const PlainTextCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: () => true,
  priority: 0,
  Editor: (props) => {
    return (
      <div>
        <pre className="m-4 mx-5 overflow-x-auto whitespace-pre-wrap break-normal rounded border border-gray-300 bg-gray-100 p-3 dark:border-gray-300-dark dark:bg-gray-100-dark">
          {props.code}
        </pre>
      </div>
    );
  },
};

const MarkdownEditor: FC<Props> = ({
  markdown,
  mode = "read",
  onChange,
  contentEditableClassName,
  className,
  shouldConfirmLeave = false,
}) => {
  const { theme } = useAppTheme();
  const [errorMarkdown, setErrorMarkdown] = useState<string | null>(null);
  const editorRef = useRef<MDXEditorMethods>(null);

  useConfirmPageLeave(shouldConfirmLeave, false);

  // Transform MathJax syntax to JSX embeds to properly utilise the MarkJax renderer
  const formattedMarkdown = useMemo(
    () => escapePlainTextSymbols(transformMathJax(markdown)),
    [markdown]
  );

  useEffect(() => {
    if (mode == "read") {
      editorRef.current?.setMarkdown(formattedMarkdown);
    }
  }, [formattedMarkdown]);

  const baseFormattingPlugins = [
    headingsPlugin(),
    listsPlugin(),
    linkPlugin(),
    quotePlugin(),
    markdownShortcutPlugin(),
    codeBlockPlugin({
      codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor],
    }),
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

  if (errorMarkdown) {
    return <div className="whitespace-pre-line">{errorMarkdown}</div>;
  }
  return (
    <MDXEditor
      ref={editorRef}
      className={classNames(
        "content markdown-editor",
        {
          "dark-theme": theme === "dark",
        },
        className
      )}
      contentEditableClassName={classNames(
        { "!p-0": mode === "read" },
        contentEditableClassName
      )}
      markdown={formattedMarkdown}
      onChange={(value) => {
        // Revert the MathJax transformation before passing the markdown to the parent component
        onChange &&
          onChange(escapePlainTextSymbols(revertMathJaxTransform(value)));
      }}
      onError={(err) => {
        logErrorWithScope(err.error, err.source);
        if (mode === "read") {
          setErrorMarkdown(markdown);
        }
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

// escape < and { that is not correctly used
function escapePlainTextSymbols(str: string) {
  const tags: any = [];
  const tagRegex = /<\/?\s*[a-zA-Z][a-zA-Z0-9-]*(?:\s+[^<>]*?)?>/g;
  let tempStr = str.replace(tagRegex, function (match) {
    tags.push(match);
    return "___HTML_TAG___";
  });

  tempStr = tempStr.replace(/([^\\])</g, "$1\\<").replace(/^</g, "\\<");

  let index = 0;
  tempStr = tempStr.replace(/___HTML_TAG___/g, function () {
    return tags[index++];
  });

  tempStr = tempStr
    .replace(/([^{]){(?![^}]*})/g, "$1\\{")
    .replace(/^{(?![^}]*})/g, "\\{");

  return tempStr;
}

export default dynamic(() => Promise.resolve(MarkdownEditor), {
  ssr: false,
});
