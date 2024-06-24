import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

const markdown = `
Hello **world**!

# Heading 1

## Heading 2

- list items 1
- list item 2

<EmbeddedQuestion id="1" />

<EmbeddedQuestion id="2" />
`;

export default function TestNewsEditor() {
  return (
    <main className="p-4">
      <h1>Edit mode:</h1>
      <div className="h-50vh mx-auto max-w-3xl overflow-auto rounded-lg bg-gray-0 dark:bg-gray-100-dark">
        <MarkdownEditor markdown={markdown} inlineJsxEmbeds />
      </div>
      <hr />
      <h1>Reader mode:</h1>
      <div className="h-50vh mx-auto max-w-6xl overflow-auto bg-gray-0 dark:bg-gray-100-dark">
        <MarkdownEditor markdown={markdown} readOnly />
      </div>
    </main>
  );
}
