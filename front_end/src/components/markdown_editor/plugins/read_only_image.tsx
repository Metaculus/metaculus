"use client";

import { ImageNode } from "@mdxeditor/editor";
import React from "react";

// MDXEditor's imagePlugin uses an imgCache that preloads images via new Image() before
// rendering. In some environments (reported on iOS Safari), this off-screen preload
// silently hangs — neither onload nor onerror fires — leaving the imgCache Promise
// permanently unresolved and React Suspense stuck on the ImagePlaceholder indefinitely.
// In read-only mode (editor.isEditable() === false), bypass ImageEditor/Suspense/imgCache
// entirely and render a plain <img> directly from the DecoratorNode.
const _originalDecorate = ImageNode.prototype.decorate;

ImageNode.prototype.decorate = function (
  this: ImageNode,
  parentEditor: Parameters<typeof _originalDecorate>[0],
  config: Parameters<typeof _originalDecorate>[1]
): ReturnType<typeof _originalDecorate> {
  if (!parentEditor.isEditable()) {
    return React.createElement("img", {
      src: this.getSrc(),
      alt: this.getAltText(),
      title: this.getTitle() ?? undefined,
      style: { maxWidth: "100%", display: "block", margin: "0 auto" },
    });
  }
  return _originalDecorate.call(this, parentEditor, config);
};
