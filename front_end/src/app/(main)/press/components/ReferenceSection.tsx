"use client";

import React from "react";

import StyledDisclosure from "../../components/styled_disclosure";

const DisclosureSection = () => {
  return (
    <div className="flex flex-col gap-2">
      <StyledDisclosure question="How to embed a Metaculus graph">
        <h4 className="text-metac-blue-800 dark:text-metac-blue-800-dark text-xl font-bold">
          On Substack, Twitter, or most other social media:
        </h4>
        <p>
          Simply paste the link to the Metaculus question URL, like{" "}
          <a href="/questions/17096/us-tracks-training-runs-by-2026/">
            www.metaculus.com/questions/17096/us-tracks-training-runs-by-2026
          </a>
          , and the preview image with the graph will show up automatically.
        </p>
        <h4 className="text-metac-blue-800 dark:text-metac-blue-800-dark text-xl font-bold">
          On Other Sites:
        </h4>
        <p>
          On the question page, click &ldquo;embed&rdquo; at the top. Choose
          your theme, width, and height, then copy the iframe onto your site.
        </p>
        <p>
          If you&apos;d prefer to have a static image rather than an embed that
          users can interact with, navigate to the URL of the embed, e.g.{" "}
          <a href="/questions/question_embed/17096/">
            www.metaculus.com/questions/question_embed/17096/
          </a>
          . Then save the image, generally via right click + &ldquo;save image
          as&rdquo;, and upload it to your preferred site.
        </p>
        <iframe
          src="/questions/question_embed/13531/?theme=light"
          style={{ maxWidth: 550, height: 430, width: "100%" }}
        />
      </StyledDisclosure>
      <StyledDisclosure question="How to download raw forecasts">
        <h4 className="text-metac-blue-800 dark:text-metac-blue-800-dark text-xl font-bold">
          Via the API:
        </h4>
        <p>
          See the <a href="/api">full API documentation</a>. You can also see
          the raw question data in your browser, like{" "}
          <a href="/api2/questions/17096/">
            www.metaculus.com/api2/questions/17096/
          </a>
          .
        </p>
        <h4 className="text-metac-blue-800 dark:text-metac-blue-800-dark text-xl font-bold">
          Download Question Data:
        </h4>
        <p>
          Select the &lsquo;...&rsquo; menu on the question page, and click
          &ldquo;Download CSV.&rdquo; (Only available on questions with a
          critical mass of predictions.) If you have more expansive data needs,
          please reach out to{" "}
          <a href="mailto:christian@metaculus.com">christian@metaculus.com</a>{" "}
          and we can construct a custom dataset for you.
        </p>
      </StyledDisclosure>
      <StyledDisclosure question="How to find the right Metaculus question">
        <p>
          There are thousands of Metaculus questions. You can search on{" "}
          <a href="/questions">the main feed</a> by topic or keyword. Our AI
          questions can be found <a href="/questions/?topic=ai">here</a>.
        </p>
        <p>
          If you can&apos;t find what you&apos;re looking for, or want to
          suggest a question to forecast, reach out to{" "}
          <a href="mailto:christian@metaculus.com">christian@metaculus.com</a> .
        </p>
      </StyledDisclosure>
    </div>
  );
};

export default DisclosureSection;
