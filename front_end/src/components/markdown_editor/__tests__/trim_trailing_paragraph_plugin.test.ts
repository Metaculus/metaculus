type NodeLike = {
  getType?: () => string;
  getPreviousSibling?: () => NodeLike | null;
  getChildren?: () => NodeLike[];
  getChildrenSize?: () => number;
  getTextContent?: () => string;
  remove?: () => void;
  __isParagraph?: boolean;
};

type EditorLike = {
  update(cb: () => void): void;
  registerUpdateListener(cb: () => void): () => void;
  __emitUpdate(): void;
};

type Realm = {
  pub: (channel: symbol, cb: (editor: EditorLike) => unknown) => void;
};

const subs = new Map<symbol, (editor: EditorLike) => void>();

let rootChildren: NodeLike[] = [];

const $getRoot = jest.fn(() => ({
  getChildren: () => rootChildren,
}));

const $isParagraphNode = (n: NodeLike | null | undefined): boolean =>
  Boolean(n && n.__isParagraph === true);

jest.mock("@mdxeditor/editor", () => {
  const CREATE_ROOT_SUB$ = Symbol("createRootEditorSubscription$");
  return {
    realmPlugin: (spec: { init: (realm: Realm) => void }) => spec,
    createRootEditorSubscription$: CREATE_ROOT_SUB$,
  };
});
jest.mock("lexical", () => {
  class MockDecoratorNode {}
  return {
    $getRoot: () => $getRoot(),
    $isParagraphNode: (n: unknown) => $isParagraphNode(n as NodeLike),
    DecoratorNode: MockDecoratorNode,
  };
});

import { createRootEditorSubscription$ } from "@mdxeditor/editor";
import { DecoratorNode } from "lexical";

import { trimTrailingParagraphPlugin } from "@/components/markdown_editor/plugins/trim_trailing_plugin";

function makeEditor(): EditorLike {
  const listeners: Array<() => void> = [];
  return {
    update(cb) {
      cb();
    },
    registerUpdateListener(cb) {
      listeners.push(cb);
      return () => {};
    },
    __emitUpdate() {
      listeners.forEach((cb) => cb());
    },
  };
}

function wirePlugin(): EditorLike {
  const realm: Realm = {
    pub: (channel, cb) => {
      subs.set(channel, cb);
    },
  };
  (trimTrailingParagraphPlugin as unknown as { init: (r: Realm) => void }).init(
    realm
  );

  const editor = makeEditor();
  const handler = subs.get(createRootEditorSubscription$ as unknown as symbol);
  if (!handler) {
    throw new Error("createRootEditorSubscription$ handler was not registered");
  }
  handler(editor);
  return editor;
}

class BlockNode implements NodeLike {
  getType() {
    return "block";
  }
}

class TextNode implements NodeLike {
  constructor(public text = "") {}
  getType(): string {
    return "text";
  }
}

class ParagraphNode implements NodeLike {
  __isParagraph = true as const;
  private prev: NodeLike | null = null;
  removed = false;

  constructor(
    private children: NodeLike[] = [],
    private textOverride?: string
  ) {}

  setPreviousSibling(prev: NodeLike | null): void {
    this.prev = prev;
  }
  getPreviousSibling(): NodeLike | null {
    return this.prev;
  }

  getChildren(): NodeLike[] {
    return this.children;
  }
  getChildrenSize(): number {
    return this.children.length;
  }

  getTextContent(): string {
    if (typeof this.textOverride === "string") return this.textOverride;
    return this.children
      .filter((c) => c.getType?.() === "text")
      .map((c) => (c as TextNode).text)
      .join("");
  }
  remove(): void {
    this.removed = true;
  }
}

function makeNonTextChild(type = "image"): NodeLike {
  return {
    getType: () => type,
  };
}

function makeDecoratorPrev(): NodeLike {
  type Ctor = new () => object;
  const inst = new (DecoratorNode as unknown as Ctor)();
  return inst as NodeLike;
}

describe("trimTrailingParagraphPlugin", () => {
  beforeEach(() => {
    rootChildren = [];
    subs.clear();
    jest.clearAllMocks();
  });

  it("trims a trailing empty text-only paragraph", () => {
    // Given
    const p1 = new ParagraphNode([new TextNode("hello")]);
    const p2 = new ParagraphNode([new TextNode("")], "\u200B   ");
    p2.setPreviousSibling(p1);
    rootChildren = [p1, p2];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(p2.removed).toBe(true);
  });

  it("does NOT trim when the last paragraph contains a non-text child (e.g., image)", () => {
    // Given
    const p1 = new ParagraphNode([new TextNode("hello")]);
    const p2 = new ParagraphNode([makeNonTextChild("image")], "");
    p2.setPreviousSibling(p1);
    rootChildren = [p1, p2];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(p2.removed).toBe(false);
  });

  it("does NOT trim when previous sibling is a DecoratorNode (embed block before blank paragraph)", () => {
    // Given
    const prev = makeDecoratorPrev();
    const p2 = new ParagraphNode([new TextNode("")], "   ");
    p2.setPreviousSibling(prev);
    rootChildren = [prev, p2];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(p2.removed).toBe(false);
  });

  it("is a no-op when root has <= 1 child", () => {
    // Given
    const only = new ParagraphNode([new TextNode("")], "");
    rootChildren = [only];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(only.removed).toBe(false);
  });

  it("does NOT trim when last paragraph has non-empty text", () => {
    // Given
    const p1 = new ParagraphNode([new TextNode("hello")]);
    const p2 = new ParagraphNode([new TextNode("world")], "world");
    p2.setPreviousSibling(p1);
    rootChildren = [p1, p2];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(p2.removed).toBe(false);
  });

  it("trims when previous sibling is a non-Decorator block", () => {
    // Given
    const prev = new BlockNode();
    const p2 = new ParagraphNode([new TextNode("")], "   ");
    p2.setPreviousSibling(prev);
    rootChildren = [prev, p2];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(p2.removed).toBe(true);
  });

  it("does NOT trim when last paragraph mixes empty text and non-text child", () => {
    // Given
    const p1 = new ParagraphNode([new TextNode("hello")]);
    const p2 = new ParagraphNode(
      [new TextNode(""), makeNonTextChild("image")],
      ""
    );
    p2.setPreviousSibling(p1);
    rootChildren = [p1, p2];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(p2.removed).toBe(false);
  });

  it("is a no-op when last child is not a paragraph", () => {
    // Given
    const p1 = new ParagraphNode([new TextNode("hello")]);
    const last = new BlockNode();
    rootChildren = [p1, last];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect((p1 as ParagraphNode).removed).toBe(false);
  });

  it("performs an immediate trim on init (no update event)", () => {
    // Given
    const p1 = new ParagraphNode([new TextNode("x")]);
    const p2 = new ParagraphNode([new TextNode("")], "\u200B");
    p2.setPreviousSibling(p1);
    rootChildren = [p1, p2];

    // When
    wirePlugin();

    // Then
    expect(p2.removed).toBe(true);
  });

  it("trims whitespace-only trailing paragraph (spaces/newlines/tabs)", () => {
    // Given
    const p1 = new ParagraphNode([new TextNode("x")]);
    const p2 = new ParagraphNode([new TextNode("")], " \n\t ");
    p2.setPreviousSibling(p1);
    rootChildren = [p1, p2];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(p2.removed).toBe(true);
  });

  it("does NOT trim when last paragraph contains a non-text inline (e.g., link node)", () => {
    // Given
    const p1 = new ParagraphNode([new TextNode("x")]);
    const p2 = new ParagraphNode([makeNonTextChild("link")], "");
    p2.setPreviousSibling(p1);
    rootChildren = [p1, p2];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(p2.removed).toBe(false);
  });

  it("trims when prev is null but last is empty", () => {
    // Given
    const p1 = new ParagraphNode([new TextNode("x")]);
    const p2 = new ParagraphNode([new TextNode("")], "");
    rootChildren = [p1, p2];

    // When
    const editor = wirePlugin();
    editor.__emitUpdate();

    // Then
    expect(p2.removed).toBe(true);
  });
});
