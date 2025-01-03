"use client";

import React from "react";

import KatexRenderer from "@/components/katex_renderer";

import StyledDisclosure from "../../../components/styled_disclosure";

const TruncationExample = () => {
  return (
    <StyledDisclosure question="Score truncation example">
      <p>
        This example uses the Baseline score, which will be noted{" "}
        <KatexRenderer equation="S" inline />, but results would be equivalent
        with any proper score.
      </p>
      <p>
        Alex wants to predict if they will be fired this year. They have a
        performance review scheduled this week. They estimate there is a{" "}
        <KatexRenderer equation="20\%" inline /> chance they fail it, and if so
        they will be fired on the spot. If they don’t fail this week, there is
        still a <KatexRenderer equation="5\%" inline /> chance they will be
        fired at the end of the year. A proper scoring rule ensures that the
        best strategy on this question is to predict{" "}
        <KatexRenderer equation="(p=(20\%+80\% \times 5\%)=24\%" inline /> this
        week, and then <KatexRenderer equation="5\%" inline /> for the other 51
        weeks (if they weren’t fired).
      </p>
      <p>
        <b>Without truncation</b>
      </p>
      <p>Without truncation, this honest strategy gives Baseline scores of:</p>
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="S(24\%) \approx -106" inline /> in the{" "}
          <KatexRenderer equation="20\%" inline /> of cases they are fired this
          week.
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(24\%) + \frac{51}{52}S(5\%) = -328"
            inline
          />{" "}
          in the <KatexRenderer equation="80\% \times 5\% = 4\%" inline /> of
          cases they are fired at the end of the year.
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(76\%) + \frac{51}{52}S(95\%) = +92"
            inline
          />{" "}
          in the <KatexRenderer equation="80\% \times 95\% = 76\%" inline /> of
          cases they are not fired.
        </li>
      </ul>
      <p>
        For an average score of{" "}
        <KatexRenderer
          equation="20\% \times -106 + 4\% \times -327 + 76\% \times +92 = +36"
          inline
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
          <KatexRenderer equation="S(99\%) \approx +99" inline /> in the{" "}
          <KatexRenderer equation="20\%" inline /> of cases they are fired this
          week.
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(99\%) + \frac{51}{52}S(5\%) = -324"
            inline
          />{" "}
          in the <KatexRenderer equation="80\% \times 5\% = 4\%" inline /> of
          cases they are fired at the end of the year.
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(1\%) + \frac{51}{52}S(95\%) = +80"
            inline
          />{" "}
          in the <KatexRenderer equation="80\% \times 95\% = 76\%" inline /> of
          cases they are not fired.
        </li>
      </ul>
      <p>
        For an average score of{" "}
        <KatexRenderer
          equation="20\% \times +99 + 4\% \times -324 + 76\% \times +80 = +68"
          inline
        />{" "}
        in expectation.
      </p>
      <p>
        Notice that <KatexRenderer equation="+68 > +36" inline />, so without
        truncation, the gaming strategy gives you a score almost twice as high
        in expectation! It is really not proper.
      </p>
      <p>
        <b>With truncation</b>
      </p>
      <p>With truncation, the honest strategy gives Baseline scores of:</p>
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="\frac{1}{52}S(24\%) \approx −2" inline /> in
          the <KatexRenderer equation="20\%" inline /> of cases they are fired
          this week.
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(24\%) + \frac{51}{52}S(5\%) = -328"
            inline
          />{" "}
          in the <KatexRenderer equation="80\% \times 5\% = 4\%" inline /> of
          cases they are fired at the end of the year.
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(76\%) + \frac{51}{52}S(95\%) = +92"
            inline
          />{" "}
          in the <KatexRenderer equation="80\% \times 95\% = 76\%" inline /> of
          cases they are not fired.
        </li>
      </ul>
      <p>
        For an average score of{" "}
        <KatexRenderer
          equation="20\% \times -2 + 4\% \times -327 + 76\% \times +92 = +56"
          inline
        />{" "}
        in expectation.
      </p>
      <p>While the gaming strategy gives:</p>
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="\frac{1}{52}S(99\%) \approx +2" inline /> in
          the <KatexRenderer equation="20\%" inline /> of cases they are fired
          this week.
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(99\%) + \frac{51}{52}S(5\%) = -324"
            inline
          />{" "}
          in the <KatexRenderer equation="80\% \times 5\% = 4\%" inline /> of
          cases they are fired at the end of the year.
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(1\%) + \frac{51}{52}S(95\%) = +80"
            inline
          />{" "}
          in the <KatexRenderer equation="80\% \times 95\% = 76\%" inline /> of
          cases they are not fired.
        </li>
      </ul>
      <p>
        For an average score of{" "}
        <KatexRenderer
          equation="20\% \times +2 + 4\% \times -324 + 76\% \times +80 = +48"
          inline
        />{" "}
        in expectation.
      </p>
      <p>
        This time, <KatexRenderer equation="+56 > +48" inline />, so with
        truncation, the gaming strategy gives you a worse score than the honest
        strategy! Which is proper.
      </p>
    </StyledDisclosure>
  );
};

export default TruncationExample;
