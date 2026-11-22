import { createRootEditorSubscription$, type Realm } from "@mdxeditor/editor";
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  DecoratorNode,
  ElementNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";

import { trimTrailingParagraphPlugin } from "@/components/markdown_editor/plugins/trim_trailing_plugin";

class EmbedNode extends DecoratorNode<null> {
  static getType() {
    return "test-embed";
  }
  static clone(node: EmbedNode) {
    return new EmbedNode(node.__key);
  }
  isInline() {
    return false;
  }
  createDOM() {
    return document.createElement("div");
  }
  updateDOM() {
    return false;
  }
  decorate() {
    return null;
  }
}

class InlineEmbedNode extends EmbedNode {
  static getType() {
    return "test-inline-embed";
  }
  static clone(node: InlineEmbedNode) {
    return new InlineEmbedNode(node.__key);
  }
  isInline() {
    return true;
  }
}

class BlockNode extends ElementNode {
  static getType() {
    return "test-block";
  }
  static clone(node: BlockNode) {
    return new BlockNode(node.__key);
  }
  createDOM() {
    return document.createElement("div");
  }
  updateDOM() {
    return false;
  }
}

const paragraph = (...children: LexicalNode[]) =>
  $createParagraphNode().append(...children);
const text = (content: string) => $createTextNode(content);

// The plugin's editor.update() calls are not discrete, so Lexical commits them
// (and the update listeners they trigger) on a later tick.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function initPlugin(build: () => LexicalNode[]): Promise<LexicalEditor> {
  const editor = createEditor({
    nodes: [EmbedNode, InlineEmbedNode, BlockNode],
    onError: (error) => {
      throw error;
    },
  });
  editor.update(
    () =>
      $getRoot()
        .clear()
        .append(...build()),
    {
      discrete: true,
    }
  );

  let subscribed = false;
  const realm = {
    pub: (channel: unknown, subscription: (editor: LexicalEditor) => void) => {
      if (channel !== createRootEditorSubscription$) return;
      subscribed = true;
      subscription(editor);
    },
  } as unknown as Realm;
  trimTrailingParagraphPlugin().init?.(realm);
  if (!subscribed) {
    throw new Error("createRootEditorSubscription$ handler was not registered");
  }

  await flush();
  return editor;
}

const rootTypes = (editor: LexicalEditor) =>
  editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .map((node) => node.getType())
  );

describe("trimTrailingParagraphPlugin", () => {
  it("trims a trailing empty paragraph added by a later update", async () => {
    // Given
    const editor = await initPlugin(() => [paragraph(text("hello"))]);

    // When
    editor.update(() => $getRoot().append(paragraph(text("​   "))));
    await flush();

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph"]);
  });

  it("does NOT trim when the last paragraph contains a non-text child (e.g., image)", async () => {
    // Given
    const build = () => [
      paragraph(text("hello")),
      paragraph(new InlineEmbedNode()),
    ];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph", "paragraph"]);
  });

  it("does NOT trim when previous sibling is a DecoratorNode (embed block before blank paragraph)", async () => {
    // Given
    const build = () => [new EmbedNode(), paragraph(text("   "))];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["test-embed", "paragraph"]);
  });

  it("is a no-op when root has <= 1 child", async () => {
    // Given
    const build = () => [paragraph()];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph"]);
  });

  it("does NOT trim when last paragraph has non-empty text", async () => {
    // Given
    const build = () => [paragraph(text("hello")), paragraph(text("world"))];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph", "paragraph"]);
  });

  it("trims when previous sibling is a non-Decorator block", async () => {
    // Given
    const build = () => [
      new BlockNode().append(text("block")),
      paragraph(text("   ")),
    ];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["test-block"]);
  });

  it("does NOT trim when last paragraph mixes blank text and non-text child", async () => {
    // Given
    const build = () => [
      paragraph(text("hello")),
      paragraph(text(" "), new InlineEmbedNode()),
    ];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph", "paragraph"]);
  });

  it("is a no-op when last child is not a paragraph", async () => {
    // Given
    const build = () => [paragraph(text("hello")), new BlockNode()];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph", "test-block"]);
  });

  it("performs a trim on init without any further update", async () => {
    // Given
    const build = () => [paragraph(text("x")), paragraph(text("​"))];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph"]);
  });

  it("trims whitespace-only trailing paragraph (spaces/newlines/tabs)", async () => {
    // Given
    const build = () => [paragraph(text("x")), paragraph(text(" \n\t "))];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph"]);
  });

  it("does NOT trim when last paragraph contains a non-text inline (e.g., line break)", async () => {
    // Given
    const build = () => [
      paragraph(text("x")),
      paragraph($createLineBreakNode()),
    ];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph", "paragraph"]);
  });

  it("trims a trailing paragraph with no children", async () => {
    // Given
    const build = () => [paragraph(text("x")), paragraph()];

    // When
    const editor = await initPlugin(build);

    // Then
    expect(rootTypes(editor)).toEqual(["paragraph"]);
  });
});
