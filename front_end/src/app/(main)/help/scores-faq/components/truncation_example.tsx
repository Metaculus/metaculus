"use client";

import React from "react";

import StyledDisclosure from "../../../components/styled_disclosure";
import MathJaxContent from "@/components/math_jax_content";

const TruncationExample = () => {
  return (
    <StyledDisclosure question="Score truncation example">
      <p>
        This example uses the Baseline score, which will be noted{" "}
        <MathJaxContent content={`\\(S\\)`} />, but results would be equivalent
        with any proper score.
      </p>
      <p>
        Alex wants to predict if they will be fired this year. They have a
        performance review scheduled this week. They estimate there is a{" "}
        <MathJaxContent content={`\\(20\\%\\)`} /> chance they fail it, and if
        so they will be fired on the spot. If they don’t fail this week, there
        is still a <MathJaxContent content={`\\(5\\%\\)`} /> chance they will be
        fired at the end of the year. A proper scoring rule ensures that the
        best strategy on this question is to predict{" "}
        <MathJaxContent content={`\\(p=(20\\%+80\\% \\times 5\\%)=24\\%\\)`} />{" "}
        this week, and then <MathJaxContent content={`\\(5\\%\\)`} /> for the
        other 51 weeks (if they weren’t fired).
      </p>
      <p>
        <b>Without truncation</b>
      </p>
      <p>Without truncation, this honest strategy gives Baseline scores of:</p>
      <ul className="ml-5 list-disc">
        <li>
          <MathJaxContent content={`\\(S(24\\%) \\approx -106\\)`} /> in the{" "}
          <MathJaxContent content={`\\(20\\%\\)`} /> of cases they are fired
          this week.
        </li>
        <li>
          <MathJaxContent
            content={`\\(\\frac{1}{52}S(24\\%) + \\frac{51}{52}S(5\\%) = -328\\)`}
          />{" "}
          in the <MathJaxContent content={`\\(80\\% \\times 5\\% = 4\\%\\)`} />{" "}
          of cases they are fired at the end of the year.
        </li>
        <li>
          <MathJaxContent
            content={`\\(\\frac{1}{52}S(76\\%) + \\frac{51}{52}S(95\\%) = +92\\)`}
          />{" "}
          in the{" "}
          <MathJaxContent content={`\\(80\\% \\times 95\\% = 76\\%\\)`} /> of
          cases they are not fired.
        </li>
      </ul>
      <p>
        For an average score of{" "}
        <MathJaxContent
          content={`\\(20\\% \\times -106 + 4\\% \\times -327 + 76\\% \\times +92 = +36\\)`}
        />{" "}
        in expectation.
      </p>
      <p>
        But the strategy of “predicting close to 100% in the beginning and lower
        later”, let&apos;s say 99% today, then 5% the other 6 days, without
        truncation gives Baseline scores of:
      </p>
      <ul className="ml-5 list-disc">
        <li>
          <MathJaxContent content={`\\(S(99\\%) \\approx +99\\)`} /> in the{" "}
          <MathJaxContent content={`\\(20\\%\\)`} /> of cases they are fired
          this week.
        </li>
        <li>
          <MathJaxContent
            content={`\\(\\frac{1}{52}S(99\\%) + \\frac{51}{52}S(5\\%) = -324\\)`}
          />{" "}
          in the <MathJaxContent content={`\\(80\\% \\times 5\\% = 4\\%\\)`} />{" "}
          of cases they are fired at the end of the year.
        </li>
        <li>
          <MathJaxContent
            content={`\\(\\frac{1}{52}S(1\\%) + \\frac{51}{52}S(95\\%) = +80\\)`}
          />{" "}
          in the{" "}
          <MathJaxContent content={`\\(80\\% \\times 95\\% = 76\\%\\)`} /> of
          cases they are not fired.
        </li>
      </ul>
      <p>
        For an average score of{" "}
        <MathJaxContent
          content={`\\(20\\% \\times +99 + 4\\% \\times -324 + 76\\% \\times +80 = +68\\)`}
        />{" "}
        in expectation.
      </p>
      <p>
        Notice that <MathJaxContent content={`\\(+68 > +36\\)`} />, so without
        truncation, the gaming strategy gives you a score almost twice as high
        in expectation! It is really not proper.
      </p>
      <p>
        <b>With truncation</b>
      </p>
      <p>With truncation, the honest strategy gives Baseline scores of:</p>
      <ul className="ml-5 list-disc">
        <li>
          <MathJaxContent content={`\\(\\frac{1}{52}S(24\\%) \\approx −2\\)`} />{" "}
          in the <MathJaxContent content={`\\(20\\%\\)`} /> of cases they are
          fired this week.
        </li>
        <li>
          <MathJaxContent
            content={`\\(\\frac{1}{52}S(24\\%) + \\frac{51}{52}S(5\\%) = -328\\)`}
          />{" "}
          in the <MathJaxContent content={`\\(80\\% \\times 5\\% = 4\\%\\)`} />{" "}
          of cases they are fired at the end of the year.
        </li>
        <li>
          <MathJaxContent
            content={`\\(\\frac{1}{52}S(76\\%) + \\frac{51}{52}S(95\\%) = +92\\)`}
          />{" "}
          in the{" "}
          <MathJaxContent content={`\\(80\\% \\times 95\\% = 76\\%\\)`} /> of
          cases they are not fired.
        </li>
      </ul>
      <p>
        For an average score of{" "}
        <MathJaxContent
          content={`\\(20\\% \\times -2 + 4\\% \\times -327 + 76\\% \\times +92 = +56\\)`}
        />{" "}
        in expectation.
      </p>
      <p>While the gaming strategy gives:</p>
      <ul className="ml-5 list-disc">
        <li>
          <MathJaxContent content={`\\(\\frac{1}{52}S(99\\%) \\approx +2\\)`} />{" "}
          in the <MathJaxContent content={`\\(20\\%\\)`} /> of cases they are
          fired this week.
        </li>
        <li>
          <MathJaxContent
            content={`\\(\\frac{1}{52}S(99\\%) + \\frac{51}{52}S(5\\%) = -324\\)`}
          />{" "}
          in the <MathJaxContent content={`\\(80\\% \\times 5\\% = 4\\%\\)`} />{" "}
          of cases they are fired at the end of the year.
        </li>
        <li>
          <MathJaxContent
            content={`\\(\\frac{1}{52}S(1\\%) + \\frac{51}{52}S(95\\%) = +80\\)`}
          />{" "}
          in the{" "}
          <MathJaxContent content={`\\(80\\% \\times 95\\% = 76\\%\\)`} /> of
          cases they are not fired.
        </li>
      </ul>
      <p>
        For an average score of{" "}
        <MathJaxContent
          content={`\\(20\\% \\times +2 + 4\\% \\times -324 + 76\\% \\times +80 = +48\\)`}
        />{" "}
        in expectation.
      </p>
      <p>
        This time, <MathJaxContent content={`\\(+56 > +48\\)`} />, so with
        truncation, the gaming strategy gives you a worse score than the honest
        strategy! Which is proper.
      </p>
    </StyledDisclosure>
  );
};

export default TruncationExample;
