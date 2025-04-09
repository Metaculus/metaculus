import "@mdxeditor/editor/style.css";
import "./editor.css";

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
import { BeautifulMentionsTheme } from "lexical-beautiful-mentions";
import React, {
  FC,
  ForwardedRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { mergeRefs } from "react-merge-refs";

import { uploadImage } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import useAppTheme from "@/hooks/use_app_theme";
import useConfirmPageLeave from "@/hooks/use_confirm_page_leave";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import cn from "@/utils/cn";
import { logErrorWithScope } from "@/utils/errors";

import {
  embeddedQuestionDescriptor,
  EmbedQuestionAction,
} from "./embedded_question";
import { tweetDescriptor } from "./embedded_twitter";
import { processMarkdown } from "./helpers";
import { equationPlugin } from "./plugins/equation";
import AddEquationAction from "./plugins/equation/components/add_equation_action";
import { linkPlugin } from "./plugins/link";
import { mentionsPlugin } from "./plugins/mentions";
import { SourceModeTitle } from "./source_mode_title";

type EditorMode = "write" | "read";

const beautifulMentionsTheme: BeautifulMentionsTheme = {
  "@": "block rounded",
  "@Focused": "ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-500-dark",
};

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  embeddedQuestionDescriptor,
  tweetDescriptor,
];

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

export type MarkdownEditorProps = {
  markdown: string;
  mode?: EditorMode;
  onChange?: (markdown: string) => void;
  onBlur?: (event: FocusEvent) => void;
  withUserMentions?: boolean;
  contentEditableClassName?: string;
  shouldConfirmLeave?: boolean;
  withUgcLinks?: boolean;
  className?: string;
  initialMention?: string;
  withTwitterPreview?: boolean;
};

/**
 * This component should never be imported directly. Instead, use the instance from index file, which disables SSR
 * For more info see: https://mdxeditor.dev/editor/docs/getting-started
 */
const InitializedMarkdownEditor: FC<
  { forwardedRef?: ForwardedRef<MDXEditorMethods> | null } & MarkdownEditorProps
> = ({
  forwardedRef,
  markdown,
  mode = "read",
  onChange,
  onBlur,
  withUserMentions,
  contentEditableClassName,
  className,
  shouldConfirmLeave = false,
  withUgcLinks,
  initialMention,
  withTwitterPreview = false,
}) => {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [errorMarkdown, setErrorMarkdown] = useState<string | null>(null);

  const editorRef = useRef<MDXEditorMethods>(null);

  useConfirmPageLeave(shouldConfirmLeave, false);

  // Transform MathJax syntax to JSX embeds to properly utilise the MarkJax renderer
  const formattedMarkdown = useMemo(
    () =>
      processMarkdown(markdown, {
        revert: false,
        withTwitterPreview: mode === "read" && withTwitterPreview,
      }),
    [markdown, mode, withTwitterPreview]
  );

  const handleEditorChange = useCallback(
    (value: string) => {
      // Revert the MathJax transformation before passing the markdown to the parent component
      onChange?.(
        processMarkdown(value, { revert: true, withTwitterPreview: false })
      );
    },
    [onChange]
  );
  const debouncedHandleEditorChange = useDebouncedCallback(
    handleEditorChange,
    500,
    { leading: true }
  );

  useEffect(() => {
    if (mode == "read") {
      editorRef.current?.setMarkdown(formattedMarkdown);
    }
  }, [formattedMarkdown]);

  const baseFormattingPlugins = [
    headingsPlugin(),
    listsPlugin(),
    linkPlugin({
      withUgcLinks,
    }),
    ...(withUserMentions
      ? [
          mentionsPlugin({
            initialMention,
            isStuff: user?.is_staff || user?.is_superuser,
          }),
        ]
      : []),
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
    equationPlugin(),
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
        <>
          <SourceModeTitle />
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
            <AddEquationAction />
            <Separator />
            <EmbedQuestionAction />
          </DiffSourceToggleWrapper>
        </>
      ),
    });
  }, [mode]);

  async function imageUploadHandler(image: File) {
    const formData = new FormData();
    formData.append("image", image);
    const response = await uploadImage(formData);
    if (!!response && "errors" in response) {
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
      ref={mergeRefs([editorRef, forwardedRef])}
      className={cn(
        "content markdown-editor",
        {
          "dark-theme": theme === "dark",
        },
        className
      )}
      contentEditableClassName={cn(
        { "!p-0": mode === "read" },
        contentEditableClassName
      )}
      markdown={formattedMarkdown}
      onChange={debouncedHandleEditorChange}
      onBlur={onBlur}
      onError={(err) => {
        logErrorWithScope(err.error, err.source);
        if (mode === "read") {
          requestAnimationFrame(() => {
            setErrorMarkdown(markdown);
          });
        }
      }}
      readOnly={mode === "read"}
      plugins={[
        ...baseFormattingPlugins,
        jsxPlugin({ jsxComponentDescriptors }),
        ...(editorDiffSourcePlugin ? [editorDiffSourcePlugin] : []),
        ...(editorToolbarPlugin ? [editorToolbarPlugin] : []),
      ]}
      lexicalTheme={{
        beautifulMentions: beautifulMentionsTheme,
        text: {
          underline: "underline",
        },
      }}
    />
  );
};

export default InitializedMarkdownEditor;
