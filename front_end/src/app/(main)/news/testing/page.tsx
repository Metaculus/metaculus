import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

const markdown = `
# Heading 1

## Heading 2

Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias deserunt dicta ea enim et ex, fugit ipsa iste laboriosam nobis nostrum repellendus sequi sit suscipit ut vel velit vero vitae.

## Math

\\(e=mc^2\\)

\\[e=mc^2\\]

\\begin{align}
  \\log_2 \\left ( \\frac{p}{0.5} \\right ) &= \\log_2 \\left ( p \\right ) + 1 \\\\
  \\log_2 \\left ( \\frac{p}{0.5} \\right ) &= \\frac{\\log(p) - \\log(0.5)}{\\log(1) - \\log(0.5)}
\\end{align}

\\begin{aligned} 2x - 4 &= 6 \\\\ 2x &= 10 \\\\ x &= 5 \\end{aligned}

> quote

- list items 1
- list item 2

[Link](https://google.com)
![image](https://fastly.picsum.photos/id/780/200/300.jpg?hmac=Zmxf0t2fpCbfZrR5NAXA_IKAP_8P6fYe9P440jUTWag "Title")

![image](https://fastly.picsum.photos/id/780/200/300.jpg?hmac=Zmxf0t2fpCbfZrR5NAXA_IKAP_8P6fYe9P440jUTWag "Title")

![image1](https://fastly.picsum.photos/id/10/2500/1667.jpg?hmac=J04WWC_ebchx3WwzbM-Z4_KC_LeLBWr5LZMaAkWkF68 "Title")

<EmbeddedQuestion id="1" />

<EmbeddedQuestion id="2" />
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
