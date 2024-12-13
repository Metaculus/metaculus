"use client";

import { MDXEditorMethods } from "@mdxeditor/editor";
import dynamic from "next/dynamic";
import React, { forwardRef } from "react";

import { MarkdownEditorProps } from "./initialized_editor";

const Editor = dynamic(() => import("./initialized_editor"), {
  ssr: false,
});

const MarkdownEditor = forwardRef<MDXEditorMethods, MarkdownEditorProps>(
  (props, ref) => <Editor {...props} forwardedRef={ref} />
);
MarkdownEditor.displayName = "MarkdownEditor";

export default MarkdownEditor;
