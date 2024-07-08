import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

const markdown = `
\\(e=mc^2\\)

# Heading 1

## Heading 2
`;

export default function TestNewsEditor() {
  return (
    <main className="p-4">
      <h1>Read mode:</h1>
      <div className="h-50vh mx-auto max-w-3xl overflow-auto rounded-lg bg-gray-0 dark:bg-gray-100-dark">
        <MarkdownEditor markdown={markdown} mode="write" />
      </div>
      <hr />
      <h1>Write mode:</h1>
      <div className="h-50vh mx-auto max-w-6xl overflow-auto bg-gray-0 px-2 dark:bg-gray-100-dark">
        <MarkdownEditor markdown={markdown} mode="read" />
      </div>
    </main>
  );
}
