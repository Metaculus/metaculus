import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

const markdown = `
# Heading 1

## Heading 2

Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias deserunt dicta ea enim et ex, fugit ipsa iste laboriosam nobis nostrum repellendus sequi sit suscipit ut vel velit vero vitae.

[Link](https://google.com)

> quote

- list items 1
- list item 2

<EmbeddedQuestion id="1" />

<EmbeddedQuestion id="2" />

`;

export default function TestNewsEditor() {
  return (
    <main className="p-4">
      <h1>Edit mode (default):</h1>
      <div className="h-50vh mx-auto max-w-3xl overflow-auto rounded-lg bg-gray-0 dark:bg-gray-100-dark">
        <MarkdownEditor markdown={markdown} />
      </div>
      <hr />
      <h1>Edit mode (extended):</h1>
      <div className="h-50vh mx-auto max-w-3xl overflow-auto rounded-lg bg-gray-0 dark:bg-gray-100-dark">
        <MarkdownEditor markdown={markdown} mode="extended" />
      </div>
      <hr />
      <h1>Reader mode:</h1>
      <div className="h-50vh mx-auto max-w-6xl overflow-auto bg-gray-0 dark:bg-gray-100-dark">
        <MarkdownEditor markdown={markdown} mode="readOnly" />
      </div>
    </main>
  );
}
