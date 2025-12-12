import "@mdxeditor/editor/style.css";
import "./editor.css";

import {
  CodeBlockEditorDescriptor,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  imagePlugin,
  JsxComponentDescriptor,
  jsxPlugin,
  linkDialogPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  MDXEditorMethods,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import { BeautifulMentionsTheme } from "lexical-beautiful-mentions";
import { useTranslations } from "next-intl";
import { Highlight, themes as prismThemes } from "prism-react-renderer";
import {
  FC,
  ForwardedRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { mergeRefs } from "react-merge-refs";

import { uploadImage } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import useAppTheme from "@/hooks/use_app_theme";
import useConfirmPageLeave from "@/hooks/use_confirm_page_leave";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import cn from "@/utils/core/cn";

import EditorToolbar from "./editor_toolbar";
import { embeddedQuestionDescriptor } from "./embedded_question";
import { tweetDescriptor } from "./embedded_twitter";
import { processMarkdown } from "./helpers";
import { codeFenceShortcutPlugin } from "./plugins/code/code_fence_shortcut";
import {
  CANONICAL_TO_LABEL,
  CANONICAL_TO_PRISM,
  normalizeLang,
} from "./plugins/code/languages";
import { equationPlugin } from "./plugins/equation";
import { linkPlugin } from "./plugins/link";
import { mentionsPlugin } from "./plugins/mentions";
import { trimTrailingParagraphPlugin } from "./plugins/trim_trailing_plugin";

type EditorMode = "write" | "read";

const beautifulMentionsTheme: BeautifulMentionsTheme = {
  "@": "block rounded",
  "@Focused": "ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-500-dark",
};

const PrismCodeBlock: FC<{ code?: string; language?: string }> = ({
  code,
  language,
}) => {
  const { theme } = useAppTheme();
  const prismTheme =
    theme === "dark" ? prismThemes.dracula : prismThemes.github;

  const raw = (language as string | undefined) ?? "ts";
  const normalizedLang = normalizeLang(raw);
  const codeTrimmed = (code ?? "").replace(/^\n+|\n+$/g, "");

  // Handle plain text without syntax highlighting
  if (normalizedLang === "text") {
    return (
      <div className="my-4">
        <pre className="overflow-x-auto rounded border border-gray-300 bg-gray-100 p-3 dark:border-gray-300-dark dark:bg-gray-100-dark">
          {codeTrimmed}
        </pre>
      </div>
    );
  }

  const prismLang = CANONICAL_TO_PRISM[normalizedLang] ?? "tsx";

  return (
    <div className="my-4">
      <Highlight
        key={theme}
        theme={prismTheme}
        code={codeTrimmed}
        language={prismLang}
      >
        {({ className, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} overflow-x-auto rounded border border-gray-300 bg-gray-100 p-3 dark:border-gray-300-dark dark:bg-gray-100-dark`}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};

const PrismCodeBlockDescriptor: CodeBlockEditorDescriptor = {
  match: () => true,
  priority: 0,
  Editor: PrismCodeBlock,
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
  withCodeBlocks?: boolean;
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
  withCodeBlocks = false,
}) => {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const t = useTranslations();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedMarkdown]);

  const jsxDescriptors: JsxComponentDescriptor[] = useMemo(
    () => [embeddedQuestionDescriptor, tweetDescriptor],
    []
  );

  const imageUploadHandler = useCallback(
    async (image: File) => {
      const MAX_FILE_SIZE_MB = 3;
      const maxFileSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
      if (image.size > maxFileSizeBytes) {
        const msg = t("fileSizeExceedsLimit", { value: MAX_FILE_SIZE_MB });
        toast(msg);
        return Promise.reject(new Error(msg));
      }

      const formData = new FormData();
      formData.append("image", image);
      const response = await uploadImage(formData);
      if (!!response && "errors" in response) {
        console.error(response.errors);
        const msg = t("errorUploadingImage");
        toast(msg);
        return Promise.reject(
          new Error(response.errors?.message ?? "Error uploading image")
        );
      } else {
        return response.url;
      }
    },
    [t]
  );

  const baseFormattingPlugins = useMemo(() => {
    const common = [
      headingsPlugin(),
      listsPlugin(),
      linkPlugin({ withUgcLinks }),
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
      thematicBreakPlugin(),
      linkDialogPlugin(),
      tablePlugin(),
      imagePlugin({
        disableImageSettingsButton: true,
        imageUploadHandler,
      }),
      equationPlugin(),
    ];

    if (!withCodeBlocks) {
      return common;
    }

    if (mode === "read") {
      return [
        ...common,
        codeBlockPlugin({
          codeBlockEditorDescriptors: [PrismCodeBlockDescriptor],
        }),
      ];
    }
    return [
      ...common,
      codeBlockPlugin({ defaultCodeBlockLanguage: "ts" }),
      codeMirrorPlugin({
        codeBlockLanguages: CANONICAL_TO_LABEL,
      }),
      codeFenceShortcutPlugin(),
    ];
  }, [
    withUgcLinks,
    withUserMentions,
    initialMention,
    user?.is_staff,
    user?.is_superuser,
    imageUploadHandler,
    mode,
    withCodeBlocks,
  ]);

  const editorToolbarPlugin = useMemo(() => {
    if (mode === "read") return null;

    return toolbarPlugin({
      toolbarContents: () => <EditorToolbar withCodeBlocks={withCodeBlocks} />,
    });
  }, [mode, withCodeBlocks]);

  const editorDiffSourcePlugin = useMemo(() => {
    if (mode === "read") return null;
    return diffSourcePlugin({ viewMode: "rich-text" });
  }, [mode]);

  const plugins = useMemo(() => {
    const list = [
      ...baseFormattingPlugins,
      jsxPlugin({ jsxComponentDescriptors: jsxDescriptors }),
    ];
    if (editorToolbarPlugin) list.push(editorToolbarPlugin);
    if (mode === "read") list.push(trimTrailingParagraphPlugin());
    if (editorDiffSourcePlugin) list.push(editorDiffSourcePlugin);
    return list;
  }, [
    baseFormattingPlugins,
    jsxDescriptors,
    editorToolbarPlugin,
    editorDiffSourcePlugin,
    mode,
  ]);

  const lexicalTheme = useMemo(
    () => ({
      beautifulMentions: beautifulMentionsTheme,
      text: { underline: "underline" },
    }),
    []
  );

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
        "mdx-content-editable",
        contentEditableClassName
      )}
      markdown={formattedMarkdown}
      onChange={debouncedHandleEditorChange}
      onBlur={onBlur}
      onError={(err) => {
        console.warn(err);
        if (mode === "read") {
          requestAnimationFrame(() => {
            setErrorMarkdown(markdown);
          });
        }
      }}
      readOnly={mode === "read"}
      plugins={plugins}
      lexicalTheme={lexicalTheme}
    />
  );
};

export default InitializedMarkdownEditor;
