import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { FC, ReactElement } from "react";

import messages from "../../../../messages/en.json";
import "./matchMedia.mock";
import InitializedMarkdownEditor, {
  MarkdownEditorProps,
} from "../initialized_editor";

const MockedEditorComponent: FC<MarkdownEditorProps> = (props) => {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <InitializedMarkdownEditor {...props} />
    </NextIntlClientProvider>
  );
};

const EDITOR_LABEL = "editable markdown";

async function renderWithAct(component: ReactElement) {
  await act(async () => {
    render(component);
  });
}

/*
 * Note: Jest fails to test editor nodes, that are not part of Lexical framework (math, jsx, etc.)
 * so we simply skip testing the render process for those elements for now and lean on helper unit tests
 */
describe("InitializedMarkdownEditor", () => {
  describe("text formatting", () => {
    it("escapes less-than symbols in text properly", async () => {
      // Given
      const markdown = "Compare: a < b is true";

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const editor = screen.getByLabelText(EDITOR_LABEL);
      expect(editor).toHaveTextContent("Compare: a < b is true");
    });

    it("escapes unpaired curly braces properly", async () => {
      // Given
      const markdown = "Unpaired brace: { without closing";

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const editor = screen.getByLabelText(EDITOR_LABEL);
      expect(editor).toHaveTextContent("Unpaired brace: { without closing");
    });

    it("escapes dollar signs in plain text", async () => {
      // Given
      const markdown = "Prices: $5, $10, and $15";

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const editor = screen.getByLabelText(EDITOR_LABEL);
      expect(editor).toHaveTextContent("Prices: $5, $10, and $15");
    });

    it("handles non-breaking spaces correctly", async () => {
      // Given
      const markdown = "Text with\u00A0non-breaking space";

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const editor = screen.getByLabelText(EDITOR_LABEL);
      expect(editor).toHaveTextContent("Text with non-breaking space");
    });
  });

  describe("blockquotes", () => {
    it("formats blockquote with empty lines correctly", async () => {
      // Given
      const markdown = "> This is a blockquote\n>\n> With multiple paragraphs";

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const editor = screen.getByLabelText(EDITOR_LABEL);
      const blockquote = editor.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();
      expect(blockquote?.textContent).toContain(
        "This is a blockquote\n" + " \n" + "With multiple paragraphs"
      );
    });

    it("correctly handles quotes in combination with html tags", async () => {
      // Given
      const markdown = `> Quote
    '<strong>bold</strong>`;

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const blockquote = document.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();
      const strong = blockquote?.querySelector("strong");
      expect(strong).toBeInTheDocument();
    });

    it("properly renders multiple empty lines in a row in blockquote", async () => {
      // Given
      const markdown = "> Line 1\n>\n>\n>. . .\n>\n> Line 4";

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const editor = screen.getByLabelText(EDITOR_LABEL);
      const blockquote = editor.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();
      expect(blockquote?.textContent).toContain(
        "Line 1\n" + " \n" + " \n" + ". . .\n" + " \n" + "Line 4"
      );
    });

    it("properly renders list in blockquote", async () => {
      // Given
      const markdown = `> Line 1
> 
> <ul><li>14 states for influenza surveillance.</li>
> <li>13 states for COVID-19 surveillance.</li>
> <li>13 states for RSV surveillance.</li></ul>
> 
> Line 4`;

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const editor = screen.getByLabelText(EDITOR_LABEL);
      const blockquote = editor.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();
      expect(blockquote?.textContent).toContain(
        "Line 1\n" +
          " \n" +
          "14 states for influenza surveillance.\n" +
          "13 states for COVID-19 surveillance.\n" +
          "13 states for RSV surveillance.\n" +
          " \n" +
          "Line 4"
      );
    });
  });

  describe("code blocks", () => {
    it("renders existing code blocks in write mode when withCodeBlocks is false", async () => {
      // Given
      const markdown = "Before\n\n```\nconsole.log('hi');\n```\n\nAfter";

      // When / Then — must not throw "Parsing of the following markdown
      // structure failed: {type: code, name: N/A}".
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="write" />
      );

      const editor = screen.getByLabelText(EDITOR_LABEL);
      expect(editor).toHaveTextContent("Before");
      expect(editor).toHaveTextContent("After");
    });
  });

  describe("html tags", () => {
    it("properly preserves HTML tags with custom attributes", async () => {
      // Given
      const markdown = '<div toggle-details="true">Content</div>';

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const divElement = document.querySelector("div[toggle-details]");
      expect(divElement).toBeInTheDocument();
      expect(divElement?.getAttribute("toggle-details")).toBe("true");
    });

    it("correctly handles iframe", async () => {
      // Given
      const markdown = '<iframe src="https://example.com"></iframe>';

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const iframe = document.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
    });

    it("correctly handles self-closing iframes", async () => {
      // Given
      const markdown = '<iframe src="https://example.com" />';

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const iframe = document.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
    });

    it("correctly handles all supported iframe attributes", async () => {
      // Given
      const markdown = `
      <iframe 
        src="https://example.com" 
        loading="lazy"
        style="border: none;" 
        width="560" 
        height="315" 
        frameborder="0" 
        allowfullscreen="true"
        scrolling="no"
      ></iframe>
    `;

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const iframe = document.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
      expect(iframe?.getAttribute("src")).toBe("https://example.com");
      expect(iframe?.getAttribute("loading")).toBe("lazy");
      expect(iframe?.getAttribute("style")).toBe("border: none;");
      expect(iframe?.getAttribute("width")).toBe("560");
      expect(iframe?.getAttribute("height")).toBe("315");
      expect(iframe?.getAttribute("frameborder")).toBe("0");
      expect(iframe?.getAttribute("allowfullscreen")).toBe("true");
      expect(iframe?.getAttribute("scrolling")).toBe("no");
    });

    it("removes unsupported iframe attributes", async () => {
      // Given
      const markdown = `
      <iframe 
        allow="autoplay; encrypted-media"
        sandbox="allow-scripts" 
        referrerpolicy="no-referrer"
      ></iframe>
    `;

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const iframe = document.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
      expect(iframe?.getAttribute("allow")).toBeNull();
      expect(iframe?.getAttribute("sandbox")).toBeNull();
      expect(iframe?.getAttribute("referrerpolicy")).toBeNull();
    });

    it("properly renders self-closing HTML tags", async () => {
      // Given
      const markdown = "Some text with <br /> and <hr /> tags";

      // When
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );

      // Then
      const editor = screen.getByLabelText(EDITOR_LABEL);
      expect(editor.querySelector("br")).toBeInTheDocument();
      expect(editor.querySelector("hr")).toBeInTheDocument();
    });
  });

  describe("stored XSS regressions", () => {
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

    async function renderRead(markdown: string) {
      await renderWithAct(
        <MockedEditorComponent markdown={markdown} mode="read" />
      );
      return screen.getByLabelText(EDITOR_LABEL);
    }

    it("renders an entity-encoded comment payload as text", async () => {
      const editor = await renderRead(
        "Hi &lt;img src=x onerror=alert(1)&gt; there"
      );

      expect(editor).toHaveTextContent("Hi <img src=x onerror=alert(1)> there");
      expect(editor.querySelector("img")).toBeNull();
      expect(findUnsafeMarkup(editor)).toEqual([]);
    });

    it.each([
      [
        "event handler",
        '<textarea><details open ontoggle="alert(1)">x</details></textarea>',
      ],
      [
        "script element",
        '<textarea><script src="https://attacker.invalid/x.js"></script></textarea>',
      ],
      [
        "javascript: link",
        '<textarea><a href="javascript:alert(1)" onclick="alert(1)">link</a></textarea>',
      ],
      [
        "srcdoc iframe",
        '<textarea><iframe srcdoc="payload"></iframe></textarea>',
      ],
      [
        "object element",
        '<textarea><object data="https://attacker.invalid/x.swf"></object></textarea>',
      ],
    ])(
      "drops a %s that reaches the editor as raw markup",
      async (_name, markdown) => {
        const editor = await renderRead(`${markdown}\n\nafter`);

        expect(editor).toHaveTextContent("after");
        expect(findUnsafeMarkup(editor)).toEqual([]);
      }
    );

    it("keeps supported formatting HTML", async () => {
      const editor = await renderRead(
        [
          '<span style="color: red">red</span>',
          '<a href="https://example.com" target="_blank">site</a>',
          "<details><summary>More</summary>Body</details>",
          "<table><tbody><tr><td>cell</td></tr></tbody></table>",
          "Tom &amp; Jerry",
        ].join("\n\n")
      );

      expect(editor.querySelector("a")?.getAttribute("href")).toBe(
        "https://example.com"
      );
      expect(editor.querySelector("details summary")).toHaveTextContent("More");
      expect(editor.querySelector("td")).toHaveTextContent("cell");
      expect(editor).toHaveTextContent("red");
      expect(editor).toHaveTextContent("Tom & Jerry");
      expect(findUnsafeMarkup(editor)).toEqual([]);
    });
  });
});
