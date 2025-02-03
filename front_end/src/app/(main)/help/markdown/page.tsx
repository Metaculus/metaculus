import { getLocale } from "next-intl/server";

import KatexRenderer from "@/components/katex_renderer";

import content_pt from "./page_pt";
import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Markdown Syntax | Metaculus",
  description:
    "Learn how to use Markdown and MathJax on Metaculus. Discover syntax for links, headers, lists, tables, code, and equations to enhance your comments and questions.",
};

export default async function Markdown() {
  const locale = await getLocale();
  if (locale === "pt") {
    return content_pt();
  }
  return (
    <PageWrapper>
      <h1>Markdown Syntax</h1>

      <p>
        When adding comments or suggesting questions, you can take advantage of{" "}
        <a href="http://daringfireball.net/projects/markdown/">Markdown</a>{" "}
        syntax to add links, emphasis, and headers. Additionally, you can add
        mathematical equations via <a href="https://www.mathjax.org">MathJax</a>
        , which will convert{" "}
        <a href="https://en.wikibooks.org/wiki/LaTeX/Mathematics">
          LaTeX syntax
        </a>{" "}
        into nicely typeset equations. We closely follow the{" "}
        <a href="http://daringfireball.net/projects/markdown/syntax">
          official Markdown syntax
        </a>
        , so that&apos;s the best place to look for a thorough explanation of
        how the system works. We provide a brief overview of the most common
        uses here.
      </p>
      <div className="table-of-contents">
        <ul className="space-y-1">
          <li>
            <a href="#inline-elements">Inline elements</a>
          </li>
          <li>
            <a href="#math">Math</a>
          </li>
          <li>
            <a href="#headers">Headers</a>
          </li>
          <li>
            <a href="#code">Code</a>
          </li>
          <li>
            <a href="#quotes">Quotes</a>
          </li>
          <li>
            <a href="#lists">Lists</a>
          </li>
          <li>
            <a href="#tables">Tables</a>
          </li>
          <li>
            <a href="#embeds">Embeds</a>
          </li>
          <li>
            <a href="#images">Images</a>
          </li>
          <li>
            <a href="#limitations">Differences and limitations</a>
          </li>
        </ul>
      </div>
      <hr />
      <h2 className="scroll-mt-nav" id="inline-elements">
        Inline elements
      </h2>
      <p>
        Links can be produced using a{" "}
        <code>[link title](http://and-link-address.com)</code> or by surrounding
        a link with <code>&lt;</code> and <code>{">"}</code>, like{" "}
        <code>&lt;http://www.example.com{">"}</code>. There are a number of
        shortcuts to make your life easier if you keep repeating the same link
        (see the{" "}
        <a href="http://daringfireball.net/projects/markdown/syntax">docs</a>),
        but these will cover 90% of the use cases.
      </p>
      <p>
        Asterisks (*) and underscores (_) will both <em>_italicize_</em> text,
        and two asterisks will make the text <strong>**bold**</strong>.
        Back-ticks denote <code>fixed-width text</code>. If you want small text,
        you can wrap it in a literal{" "}
        <small>
          &lt;small{">"}html tag&lt;/small{">"}
        </small>
        . Special characters (<code>*_{}#+-.!\</code>) can be escaped using a
        backslash, like <code>\*</code>, if they would otherwise be converted
        into a markdown element.
      </p>
      <p>
        We also allow a limited subset of HTML tags, which you can mix with
        markdown syntax if you want. These include: <code>&lt;a{">"}</code>,{" "}
        <code>&lt;p{">"}</code>, <code>&lt;em{">"}</code>,{" "}
        <code>&lt;strong{">"}</code>, <code>&lt;small{">"}</code>,{" "}
        <code>&lt;ol{">"}</code>, <code>&lt;ul{">"}</code>,{" "}
        <code>&lt;li{">"}</code>, <code>&lt;br{">"}</code>,{" "}
        <code>&lt;code{">"}</code>, <code>&lt;pre{">"}</code>,{" "}
        <code>&lt;blockquote{">"}</code>, <code>&lt;aside{">"}</code>,{" "}
        <code>&lt;div{">"}</code>, <code>&lt;h1{">"}</code>,{" "}
        <code>&lt;h2{">"}</code>, <code>&lt;h3{">"}</code>,{" "}
        <code>&lt;h4{">"}</code>, <code>&lt;h5{">"}</code>,{" "}
        <code>&lt;h6{">"}</code>, <code>&lt;math-inline{">"}</code>,{" "}
        <code>&lt;math-display{">"}</code>, <code>&lt;hr{">"}</code>,{" "}
        <code>&lt;table{">"}</code>, <code>&lt;thead{">"}</code>,{" "}
        <code>&lt;tbody{">"}</code>, <code>&lt;tr{">"}</code>,{" "}
        <code>&lt;th{">"}</code>, <code>&lt;td{">"}</code>,{" "}
        <code>&lt;del{">"}</code>, <code>&lt;sup{">"}</code>,{" "}
        <code>&lt;sub{">"}</code>.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="math">
        Math
      </h2>
      <p>
        We supplement Markdown with <a href="https://katex.org/">Latex</a>{" "}
        equation processing. Mathematical formatting works by placing your
        equation between <code>$</code> and <code>$</code> (for inline
        equations) or <code>$$</code> and <code>$$</code> (for displayed
        equations). More complicated equations can be put in an{" "}
        <code>align</code> environment, like so
      </p>
      <pre>
        {`\\begin{align}
  \\log_2 \\left ( \\frac{p}{0.5} \\right ) &amp;= \\log_2 \\left ( p \\right ) + 1 \\\\
  \\log_2 \\left ( \\frac{p}{0.5} \\right ) &amp;= \\frac{\\log(p) - \\log(0.5)}{\\log(1) - \\log(0.5)}
\\end{align}`}
      </pre>
      <p>producing</p>
      <KatexRenderer
        equation={`\\begin{align}
    \\log_2 \\left ( \\frac{p}{0.5} \\right ) &= \\log_2 \\left ( p \\right ) + 1 \\\\
    \\log_2 \\left ( \\frac{p}{0.5} \\right ) &= \\frac{\\log(p) - \\log(0.5)}{\\log(1) - \\log(0.5)}
    \\end{align}`}
        inline={false}
      />

      <hr />
      <h2 className="scroll-mt-nav" id="headers">
        Headers
      </h2>
      <p>Headers are easiest to add using hash marks, for example</p>
      <pre>
        {`# Primary header
## Secondary header
##### Fifth-level header`}
      </pre>

      <p>Please use headers in comments sparingly!</p>
      <hr />
      <h2 className="scroll-mt-nav" id="code">
        Code
      </h2>
      <p>Big chunks of code can be wrapped in three back-ticks. For example:</p>
      <pre>
        &#96;&#96;&#96;
        {`
def hello_world():
    print('hello!')`}
        <br />
        &#96;&#96;&#96;
      </pre>

      <hr />
      <h2 className="scroll-mt-nav" id="quotes">
        Quotes
      </h2>
      <p>
        If you want to quote someone, precede each line with a <code>&gt;</code>
        :
      </p>
      <pre>
        {`> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
> consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
> Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.

> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
> id sem consectetuer libero luctus adipiscing.`}
      </pre>
      <p>which would produce:</p>
      <blockquote className="ml-4 border-l border-gray-500/50 pl-4 opacity-75">
        <p>
          This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
          consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
          Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.
        </p>
        <p>
          Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
          id sem consectetuer libero luctus adipiscing.
        </p>
      </blockquote>

      <hr />
      <h2 className="scroll-mt-nav" id="lists">
        Lists
      </h2>
      <p>Markdown can handle both ordered and unordered lists. For example,</p>
      <pre>
        {`1. First item
2. Second item

    Another paragraph in the second item. (Note the 4-spaces indentation.)

    - Sublist item 1. (Note the 4-spaces indentation.)
    - Sublist item 2.

3. Third item.`}
      </pre>
      <p>produces:</p>
      <ol className="list-inside list-decimal space-y-3">
        <li>First item</li>
        <li>
          Second item
          <p className="pl-8">
            Another paragraph in the second item. (Note the 4-spaces
            indentation.)
          </p>
          <ul className="list-inside list-disc pl-8">
            <li>Sublist item 1. (Note the 4-spaces indentation.)</li>
            <li>Sublist item 2.</li>
          </ul>
        </li>
        <li>Third item.</li>
      </ol>
      <p>
        Unordered lists behave similarly, but use <code>*</code> or{" "}
        <code>+</code> or <code>-</code> to denote new items.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="tables">
        Tables
      </h2>
      <p>We support simple tables of the form:</p>
      <pre>
        {`| Header 1 | Header 2 |   ← headers
|----------|----------|   ← mandatory header separator
| Cell 1   | Cell 2   |   ← line 1
| Cell 3   | Cell 4   |   ← line 2`}
      </pre>
      <p>
        Columns are separated by the pipe character <code>|</code>, and each
        line is a row. For example, this:
      </p>
      <pre>
        {`|Year | Predictions |  Total |
|-----|-------------|--------|
|2015 |         500 |    500 |
|2016 |       25500 |  26000 |
|2017 |       21000 |  47000 |
|2018 |       63000 | 110000 |
|2019 |       50000 | 160000 |
|2020 |      220000 | 380000 |`}
      </pre>
      <p>Will render as:</p>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white dark:border-blue-700 dark:bg-blue-900 md:dark:bg-blue-800">
          <thead className="bg-gray-100 dark:bg-blue-950">
            <tr>
              <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-blue-700 dark:text-gray-400">
                Year
              </th>
              <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold  text-gray-700 dark:border-blue-700 dark:text-gray-400">
                Predictions
              </th>
              <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-blue-700 dark:text-gray-400">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400 ">
                2015
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                500
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                500
              </td>
            </tr>
            <tr>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                2016
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                25500
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                26000
              </td>
            </tr>
            <tr>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                2017
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                21000
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                47000
              </td>
            </tr>
            <tr>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                2018
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                63000
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                110000
              </td>
            </tr>
            <tr>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                2019
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                50000
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                160000
              </td>
            </tr>
            <tr>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                2020
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                220000
              </td>
              <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                380000
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr />
      <h2 className="scroll-mt-nav" id="embeds">
        Embeds
      </h2>
      <p>
        We allow <code>&lt;iframe{">"}</code> embeds from a limited list of
        trusted sites, currently including:
      </p>
      <ul className="ml-5 list-disc">
        <li>afdc.energy.gov</li>
        <li>data.worldbank.org</li>
        <li>fred.stlouisfed.org</li>
        <li>ourworldindata.org</li>
        <li>www.eia.gov</li>
        <li>metaculus.com</li>
      </ul>
      <p>Note that this means you can embed Metaculus questions:</p>
      <pre>
        {`<iframe src="https://www.metaculus.com/questions/embed/8/" height="320" width="550"></iframe>`}
      </pre>
      <p>will render as:</p>
      <div className="w-full overflow-x-auto">
        <iframe
          src="https://www.metaculus.com/questions/embed/8/"
          height="320"
          width="550"
        ></iframe>
      </div>
      <p>
        Note that for now this is only possible in question bodies, not in
        comments.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="images">
        Images
      </h2>
      <p>
        We also allow <code>&lt;img{">"}</code> images:
      </p>
      <pre>
        {`<img src="https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg" alt="markdown logo">`}
      </pre>
      <p>will render as:</p>
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg"
        alt="markdown logo"
      />

      <hr />
      <h2 className="scroll-mt-nav" id="limitations">
        Differences and limitations
      </h2>
      <p>
        The official Markdown specification lets users input raw HTML, but we
        limit users to the elements described above. For example, if you try to
        input an image using <code>![Alt text](/path/to/img.jpg)</code> the
        output will look like &lt;img alt=&quot;Alt text&quot;
        src=&quot;/path/to/img.jpg&quot;/{">"}, and something like{" "}
        <code>
          &lt;script{">"}doSomethingEvil()&lt;/script{">"}
        </code>{" "}
        certainly won&apos;t work. We also employ a few markdown extensions that
        handle fenced code blocks (described above) and make{" "}
        <a href="https://python-markdown.github.io/extensions/sane_lists/">
          lists
        </a>{" "}
        and bolded text a little easier to manage.
      </p>
    </PageWrapper>
  );
}
