import { $insertDataTransferForRichText } from "@lexical/clipboard";
import { GenericHTMLNode, MDXEditorMethods } from "@mdxeditor/editor";
import { act, cleanup, render, screen } from "@testing-library/react";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  createEditor,
} from "lexical";
import { NextIntlClientProvider } from "next-intl";
import { createRef } from "react";

import messages from "../../../../messages/en.json";
import "./matchMedia.mock";
import { processMarkdown } from "../helpers";
import InitializedMarkdownEditor, {
  MarkdownEditorProps,
} from "../initialized_editor";

// jsdom lacks structuredClone, which MDXEditor uses to clone JSX nodes
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = ((value: unknown) =>
    value === undefined
      ? value
      : JSON.parse(JSON.stringify(value))) as typeof structuredClone;
}

const mockGetPost = jest.fn();
jest.mock("@/services/api/posts/posts.client", () => ({
  __esModule: true,
  default: { getPost: (...args: unknown[]) => mockGetPost(...args) },
}));

const fetchMock = jest.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  mockGetPost.mockReset().mockReturnValue(new Promise(() => {}));
  fetchMock.mockReset().mockReturnValue(new Promise(() => {}));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const PRIVATE_USE = /[-]/;

async function renderEditor({
  markdown,
  mode = "read",
}: Pick<MarkdownEditorProps, "markdown" | "mode">) {
  const ref = createRef<MDXEditorMethods>();
  await act(async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <InitializedMarkdownEditor
          forwardedRef={ref}
          markdown={markdown}
          mode={mode}
          withTwitterPreview
          withUgcLinks
        />
      </NextIntlClientProvider>
    );
  });
  return { editor: screen.getByLabelText("editable markdown"), ref };
}

// Bypasses processMarkdown so only the editor's own import path is exercised
async function renderRawMdx(mdx: string) {
  const { editor, ref } = await renderEditor({ markdown: "" });
  await act(async () => {
    ref.current?.setMarkdown(mdx);
  });
  return editor;
}

async function saveAndReload(markdown: string) {
  const { editor: original } = await renderEditor({ markdown });
  const renderedText = original.textContent;
  cleanup();

  const { ref: writeRef } = await renderEditor({ markdown, mode: "write" });
  const saved = processMarkdown(writeRef.current?.getMarkdown() ?? "", {
    revert: true,
  });
  cleanup();

  const { editor: reloaded } = await renderEditor({ markdown: saved });
  return { renderedText, saved, reloaded };
}

const findUnsafeMarkup = (root: HTMLElement) =>
  Array.from(root.querySelectorAll("*")).flatMap((element) => [
    ...(["SCRIPT", "OBJECT", "EMBED", "FORM", "BASE", "META"].includes(
      element.tagName
    )
      ? [element.tagName]
      : []),
    ...Array.from(element.attributes)
      .filter(
        ({ name, value }) =>
          name.startsWith("on") ||
          name === "srcdoc" ||
          /^\s*javascript:/i.test(value)
      )
      .map(({ name }) => `${element.tagName}[${name}]`),
  ]);

const wrap = (wrapper: string, inner: string) =>
  `<${wrapper}>${inner}</${wrapper}>\n\nafter`;

type MarkupCase = [string, string, (editor: HTMLElement) => void];

const MARKUP_CASES: MarkupCase[] = [
  [
    "details with ontoggle",
    '<details open ontoggle="alert(1)"><summary>Sum</summary>Safe body</details>',
    (editor) => {
      const details = editor.querySelector("details");
      expect(details).not.toBeNull();
      expect(details?.hasAttribute("ontoggle")).toBe(false);
      expect(details?.querySelector("summary")).toHaveTextContent("Sum");
      expect(details).toHaveTextContent("Safe body");
    },
  ],
  [
    "entity-encoded javascript: href",
    '<a href="&#106;ava&#x73;cript&colon;alert(1)" title="ok">enc link</a>',
    (editor) => {
      const link = editor.querySelector("a");
      expect(link).toHaveTextContent("enc link");
      expect(link?.hasAttribute("href")).toBe(false);
      expect(link?.getAttribute("title")).toBe("ok");
    },
  ],
  [
    "expression and spread attributes",
    '<div class="note" {...props} title={"x"} onclick={alert(1)}>spread body</div>',
    (editor) => {
      const div = editor.querySelector("div.note");
      expect(div).toHaveTextContent("spread body");
      expect(div?.getAttributeNames().sort()).toEqual(["class"]);
    },
  ],
  [
    "table cell with handler",
    '<table><tbody><tr><td colspan="2" onclick="alert(1)">cell body</td></tr></tbody></table>',
    (editor) => {
      const cell = editor.querySelector("td");
      expect(cell).toHaveTextContent("cell body");
      expect(cell?.getAttribute("colspan")).toBe("2");
      expect(cell?.hasAttribute("onclick")).toBe(false);
    },
  ],
  [
    "script element",
    '<script src="https://attacker.invalid/x.js"></script>',
    (editor) => expect(editor.querySelector("script")).toBeNull(),
  ],
  [
    "iframe srcdoc",
    '<iframe src="https://example.com/embed" srcdoc="payload"></iframe>',
    (editor) => {
      const iframe = editor.querySelector("iframe");
      expect(iframe?.getAttribute("src")).toBe("https://example.com/embed");
      expect(iframe?.hasAttribute("srcdoc")).toBe(false);
    },
  ],
  [
    "object element",
    '<object data="https://attacker.invalid/x.swf">fallback text</object>',
    (editor) => {
      expect(editor.querySelector("object")).toBeNull();
      expect(editor).toHaveTextContent("fallback text");
    },
  ],
];

describe("safe rendering in the real editor", () => {
  it("renders an entity-encoded comment payload as text", async () => {
    const { editor } = await renderEditor({
      markdown: "Hi &lt;img src=x onerror=alert(1)&gt; there",
    });

    expect(editor).toHaveTextContent("Hi <img src=x onerror=alert(1)> there");
    expect(editor.querySelector("img")).toBeNull();
  });

  describe.each([
    ["textarea via processMarkdown", "textarea", false],
    ["textarea as raw MDX", "textarea", true],
    ["title as raw MDX", "title", true],
  ])("markup wrapped in %s", (_label, wrapper, raw) => {
    it.each(MARKUP_CASES)(
      "strips the unsafe part of %s and keeps the safe content",
      async (_name, inner, check) => {
        const markdown = wrap(wrapper, inner);
        const editor = raw
          ? await renderRawMdx(markdown)
          : (await renderEditor({ markdown })).editor;

        check(editor);
        expect(editor).toHaveTextContent("after");
        expect(findUnsafeMarkup(editor)).toEqual([]);
      }
    );
  });

  it("keeps supported formatting HTML", async () => {
    const { editor } = await renderEditor({
      markdown: [
        '<span style="color: red">red</span>',
        '<a href="https://example.com" target="_blank">site</a>',
        "<details><summary>More</summary>Body</details>",
        "<table><tbody><tr><td>cell</td></tr></tbody></table>",
        "Tom &amp; Jerry",
      ].join("\n\n"),
    });

    expect(editor.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com"
    );
    expect(editor.querySelector("details summary")).toHaveTextContent("More");
    expect(editor.querySelector("td")).toHaveTextContent("cell");
    expect(editor).toHaveTextContent("red");
    expect(editor).toHaveTextContent("Tom & Jerry");
    expect(findUnsafeMarkup(editor)).toEqual([]);
  });

  describe("Markdown link and image schemes", () => {
    it.each([
      "[link text](javascript:alert(1))",
      "[link text](&#106;avascript:alert(1))",
      "[link text](JaVaScRiPt:alert(1))",
    ])("neutralises %s and keeps the link text", async (markdown) => {
      const { editor } = await renderEditor({ markdown });

      const link = editor.querySelector("a");
      expect(link).toHaveTextContent("link text");
      expect(link?.getAttribute("href")).toBe("about:blank");
    });

    it("drops an unsafe image source and keeps its alt text", async () => {
      const { editor } = await renderEditor({
        markdown:
          "![alt text](javascript:alert(1)) ![ok](https://example.com/a.png)",
      });

      const [unsafe, safe] = Array.from(editor.querySelectorAll("img"));
      expect(unsafe?.getAttribute("alt")).toBe("alt text");
      expect(unsafe?.hasAttribute("src")).toBe(false);
      expect(safe?.getAttribute("src")).toBe("https://example.com/a.png");
    });
  });

  describe("embed ids", () => {
    const requests = () => [
      ...fetchMock.mock.calls.map(([url]) => String(url)),
      ...mockGetPost.mock.calls.map(([id]) => `getPost:${String(id)}`),
    ];

    it.each([
      ["textarea", '<Tweet id="../../api-proxy/users/me" />', false],
      ["title", '<Tweet id="../../api-proxy/users/me" />', false],
      ["textarea", '<Tweet id="../../api-proxy/users/me" />', true],
      ["title", '<Tweet id="../../api-proxy/users/me" />', true],
      ["textarea", '<EmbeddedQuestion id="../../users/me" />', true],
      ["title", '<EmbeddedQuestion id="../../users/me" />', true],
    ])(
      "renders nothing for a non-numeric id wrapped in <%s>: %s (raw MDX: %s)",
      async (wrapper, embed, raw) => {
        const markdown = wrap(wrapper, embed);
        const editor = raw
          ? await renderRawMdx(markdown)
          : (await renderEditor({ markdown })).editor;

        expect(editor.querySelector(".tweet-embed, iframe")).toBeNull();
        expect(editor).toHaveTextContent("after");
        expect(requests()).toEqual([]);
      }
    );

    it.each([
      '<Tweet id="123abc" />',
      '<Tweet id="" />',
      '<EmbeddedQuestion id="0x1F" />',
      '<EmbeddedQuestion id="" />',
      "<EmbeddedQuestion id={alert(1)} />",
    ])("renders nothing for %s", async (mdx) => {
      await renderRawMdx(`${mdx}\n\nafter`);

      expect(requests()).toEqual([]);
    });

    it("still renders numeric embeds", async () => {
      await renderRawMdx(
        [
          '<EmbeddedQuestion id="456" />',
          "<EmbeddedQuestion id={789} />",
          '<Tweet id="1234567890" />',
        ].join("\n\n")
      );

      expect(mockGetPost.mock.calls.map(([id]) => id)).toEqual([456, 789]);
      expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain(
        "/tweet/1234567890?v=2"
      );
    });

    it("restores an embed nested in a void-tag chunk", async () => {
      const { editor } = await renderEditor({
        markdown: '<br class="a"><EmbeddedQuestion id="321" /></br>',
      });

      expect(editor.textContent).not.toMatch(PRIVATE_USE);
      expect(editor.textContent).not.toContain("JSX_COMPONENT");
      expect(mockGetPost).toHaveBeenCalledWith(321);
    });
  });

  describe("placeholder markers", () => {
    it("keeps literal marker text and real ampersands through save and reload", async () => {
      const marker = `${String.fromCharCode(0xe000)}0amp${String.fromCharCode(0xe001)}`;
      const markdown = `Literal x___AMPERSAND___y, \`___AMPERSAND___\`, ${marker} and AT&T &amp; co`;

      const { renderedText, saved, reloaded } = await saveAndReload(markdown);

      expect(renderedText).toContain("x___AMPERSAND___y");
      expect(renderedText).toContain("___AMPERSAND___,");
      expect(renderedText).toContain(marker);
      expect(renderedText).toContain("AT&T & co");
      expect(saved).toContain("___AMPERSAND___");
      expect(reloaded.textContent).toBe(renderedText);
    });
  });

  describe("entities in literal contexts", () => {
    it("shows entities in code verbatim and keeps them through save and reload", async () => {
      const markdown =
        "```\nsame week.&#x20;\nif (a &lt; b && c) {}\n```\n\nInline `x &amp; y` and text a &lt; b";

      const { renderedText, saved, reloaded } = await saveAndReload(markdown);

      expect(renderedText).toContain("same week.&#x20;");
      expect(renderedText).toContain("if (a &lt; b && c) {}");
      expect(renderedText).toContain("x &amp; y");
      expect(renderedText).toContain("text a < b");
      expect(saved).toContain("&#x20;");
      expect(reloaded.textContent).toBe(renderedText);
    });
  });
});

describe("pasted Lexical clipboard JSON", () => {
  it("filters generic HTML nodes the same way as imported Markdown", () => {
    const editor = createEditor({
      namespace: "MDXEditor",
      nodes: [GenericHTMLNode],
      onError: (error) => {
        throw error;
      },
    });
    const root = document.createElement("div");
    root.contentEditable = "true";
    document.body.append(root);
    editor.setRootElement(root);

    const node = (
      tag: string,
      attributes: Record<string, string>,
      text: string
    ) => ({
      type: "generic-html",
      version: 1,
      tag,
      mdxType: "mdxJsxFlowElement",
      attributes: Object.entries(attributes).map(([name, value]) => ({
        type: "mdxJsxAttribute",
        name,
        value,
      })),
      children: [
        {
          type: "text",
          version: 1,
          text,
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
        },
      ],
      direction: null,
      format: "",
      indent: 0,
    });
    const payload = JSON.stringify({
      namespace: "MDXEditor",
      nodes: [
        node("img", { src: "x", onerror: "alert(1)" }, "image text"),
        node("div", { class: "note", onclick: "alert(1)" }, "div text"),
        node("script", { src: "https://attacker.invalid/x.js" }, "kept text"),
        node("a", { href: "javascript:alert(1)", title: "t" }, "link"),
      ],
    });
    const dataTransfer = {
      getData: (type: string) =>
        type === "application/x-lexical-editor" ? payload : "",
    } as unknown as DataTransfer;

    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        $getRoot().append(paragraph);
        paragraph.select();
        const selection = $getSelection();
        if (selection) {
          $insertDataTransferForRichText(dataTransfer, selection, editor);
        }
      },
      { discrete: true }
    );

    expect(root.querySelector("img")).toBeNull();
    expect(root).toHaveTextContent("image text");
    const div = root.querySelector("div.note");
    expect(div).toHaveTextContent("div text");
    expect(div?.hasAttribute("onclick")).toBe(false);
    expect(root.querySelector("script")).toBeNull();
    expect(root).toHaveTextContent("kept text");
    expect(root.querySelector("a")?.hasAttribute("href")).toBe(false);
    expect(root.querySelector("a")?.getAttribute("title")).toBe("t");
    expect(findUnsafeMarkup(root)).toEqual([]);
    root.remove();
  });
});
