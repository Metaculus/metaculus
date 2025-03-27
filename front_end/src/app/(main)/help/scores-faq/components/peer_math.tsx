"use client";

import Link from "next/link";
import React from "react";

import KatexRenderer from "@/components/katex_renderer";

import StyledDisclosure from "../../../components/styled_disclosure";

const PeerMath = () => {
  return (
    <StyledDisclosure question="Peer score math">
      <p>
        The Peer scores are built on{" "}
        <Link href="/help/scores-faq/#log-score">log scores</Link>, with the
        general form:
      </p>
      <KatexRenderer
        equation="\text{Peer score} = 100 \times \frac{1}{N} \sum_{i = 1}^N \operatorname{log\ score}(p) - \operatorname{log\ score}(p_i)"
        inline={false}
      />
      <p>
        Where <KatexRenderer equation="p" inline /> is the scored prediction,{" "}
        <KatexRenderer equation="N" inline /> is the number of other
        predictions, and <KatexRenderer equation="p_i" inline /> is the i-th
        other prediction.
      </p>
      <p>Note that this can be rearranged into:</p>
      <KatexRenderer
        equation="\text{Peer score} = 100 \times (\ln(p) - \ln(\operatorname{GM}(p_i)))"
        inline={false}
      />
      <p>
        Where{" "}
        <a href="https://en.wikipedia.org/wiki/Geometric_mean">
          <KatexRenderer equation="\operatorname{GM}(p_i)" inline />
        </a>{" "}
        is the geometric mean of all other predictions.
      </p>
      <p>
        As before, for binary questions <KatexRenderer equation="p" inline /> is
        the probability given to the correct outcome (Yes or No), for multiple
        choice questions it is the probability given to the option outcome that
        resolved Yes, and for continuous questions it is the value of the
        predicted pdf at the outcome.
      </p>
    </StyledDisclosure>
  );
};

export default PeerMath;
