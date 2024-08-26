import PageWrapper from "../../components/pagewrapper";
import MathJaxWrapper from "../../components/mathjaxwrapper";

export const metadata = {
  title: "Scores FAQ | Metaculus",
  description: "tbd",
};

export default function ScoresFAQ() {
  return (
    <PageWrapper>
      <h1>Scores FAQ</h1>
      <p>
        Below are Frequently Asked Questions (and answers!) about scores. The
        general FAQ is <a href="/help/faq/">here</a>, and the medals FAQ is{" "}
        <a href="/help/medals-faq/">here</a>.
      </p>

      <p>Contents:</p>
      <div className="table-of-contents">
        <ul>
          <li>
            <a href="#scores-section">Scores</a>
          </li>
          <ul className="label-font">
            <li>
              <a href="#scoring-rule">What is a scoring rule?</a>
            </li>
            <li>
              <a href="#proper-scoring">What is a proper scoring rule?</a>
            </li>
            <li>
              <a href="#log-score">What is the log score?</a>
            </li>
            <li>
              <a href="#continuous-log-score">
                What is the log score for continuous questions?
              </a>
            </li>
            <li>
              <a href="#baseline-score">What is the Baseline score?</a>
            </li>
            <li>
              <a href="#peer-score">What is the Peer score?</a>
            </li>
            <li>
              <a href="#cp-positive-peer">
                Why is the Peer Score of the Community Prediction positive?
              </a>
            </li>
            <li>
              <a href="#time-averaging">
                Do all my predictions on a question count toward my score?
              </a>
            </li>
            <li>
              <a href="#extremizing">
                Can I get better scores by predicting extreme values?
              </a>
            </li>
            <li>
              <a href="#score-truncation">
                Why did I get a small score when I was right?
              </a>
            </li>
            <li>
              <a href="#legacy-scores">What are the legacy scores?</a>
              <ul className="label-font">
                <li>
                  <a href="#relative-score">What is the Relative score?</a>
                </li>
                <li>
                  <a href="#coverage">What is the coverage?</a>
                </li>
                <li>
                  <a href="#old-points">What are Metaculus points?</a>
                </li>
              </ul>
            </li>
          </ul>
          <li>
            <a href="#tournaments-section">Tournaments</a>
          </li>
          <ul className="label-font">
            <li>
              <a href="#tournament-scores">
                How are my tournament Score, Coverage, Take, Prize and Rank
                calculated?
              </a>
            </li>
            <li>
              <a href="#legacy-tournament-scores">
                How are my (legacy) tournament Score, Coverage, Take, Prize and
                Rank calculated?
              </a>
            </li>
            <li>
              <a href="#hidden-period">
                What are the Hidden Period and Hidden Coverage Weights?
              </a>
            </li>
          </ul>
        </ul>
      </div>

      <hr className="my-4" />

      <h1 className="scroll-mt-nav" id="scores">
        Scores
      </h1>

      <h2 className="scroll-mt-nav" id="scoring-rule">
        What is a scoring rule?
      </h2>
      <p>
        A scoring rule is a mathematical function which, given a prediction and
        an outcome, gives a score in the form of a number.
      </p>
      <p>
        A naive scoring rule could be: &quot;you score equals the probability
        you gave to the correct outcome&quot;. So, for example, if you predict
        80% and the question resolves Yes, your score would be 0.8 (and 0.2 if
        the question resolved No). At first glance this seems like a good
        scoring rule: forecasters who gave predictions closer to the truth get
        higher scores.
      </p>
      <p>
        Unfortunately this scoring rule is not &quot;proper&quot;, as we&apos;ll
        see in the next section.
      </p>

      <h2 className="scroll-mt-nav" id="proper-scoring">
        What is a proper scoring rule?
      </h2>
      <p>
        Proper scoring rules have a very special property: the only way to
        optimize your score on average is to predict your sincere beliefs.
      </p>
      <p>
        How do we know that the naive scoring rule from the previous section is
        not proper? An example should be illuminating: consider the question
        &quot;Will I roll a 6 on this fair die?&quot;. Since the die is fair,
        your belief is &quot;1/6&quot; or about 17%. Now consider three
        possibilities: you could either predict your true belief (17%), predict
        something more extreme, like 5%, or predict something less extreme, like
        30%. Here&apos;s a table of the scores you expect for each possible die
        roll:
      </p>

      <div className="overflow-x-auto">
        <table className="mx-auto w-auto border-collapse">
          <thead>
            <tr className="text-sm font-bold">
              <td className="p-3">outcome die roll</td>
              <td className="p-3">naive score of p=5%</td>
              <td className="p-3">naive score of p=17%</td>
              <td className="p-3">naive score of p=30%</td>
            </tr>
          </thead>
          <tbody>
            <tr className="text-sm font-normal">
              <td className="p-3">1</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">2</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">3</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">4</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">5</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">6</td>
              <td className="p-3">0.05</td>
              <td className="p-3">0.17</td>
              <td className="p-3">0.3</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">average</td>
              <td className="p-3">0.8</td>
              <td className="p-3">0.72</td>
              <td className="p-3">0.63</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Which means you get a better score on average if you predict 5% than
        17%. In other words, this naive score incentivizes you to predict
        something other than the true probability. This is very bad!
      </p>
      <p>
        Proper scoring rules do not have this problem: your score is best when
        you predict the true probability. The log score, which underpins all
        Metaculus scores, is a proper score (see{" "}
        <a href="/help/scores-faq/#log-score">What is the log score?</a>). We
        can compare the scores you get in the previous example:
      </p>

      <div className="overflow-x-auto">
        <table className="mx-auto w-auto border-collapse">
          <thead>
            <tr className="text-sm font-normal">
              <td className="p-3">outcome die roll</td>
              <td className="p-3">log score of p=5%</td>
              <td className="p-3">log score of p=17%</td>
              <td className="p-3">log score of p=30%</td>
            </tr>
          </thead>
          <tbody>
            <tr className="text-sm font-normal">
              <td className="p-3">1</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">2</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">3</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">4</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">5</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">6</td>
              <td className="p-3">-3</td>
              <td className="p-3">-1.77</td>
              <td className="p-3">-1.2</td>
            </tr>
            <tr className="text-sm font-normal">
              <td className="p-3">average</td>
              <td className="p-3">-0.54</td>
              <td className="p-3">-0.45</td>
              <td className="p-3">-0.51</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        With the log score, you do get a higher (better) score if you predict
        the true probability of 17%.
      </p>
      {/* 
  <h2 className="section-header" id="log-score">What is the log score?</h2>
  <p>The logarithmic scoring rule, or &quot;log score&quot; for short, is defined as:</p>
  <MathJaxWrapper>
    {`\\[
    \\text{log score} = \\ln(P(outcome))
    \\]`}
  </MathJaxWrapper>
  <p>Where <MathJaxWrapper>{`\\(\\ln\\)`}</MathJaxWrapper> is the natural logarithm and <MathJaxWrapper>{`\\(P(outcome)\\)`}</MathJaxWrapper> is the probability predicted for the outcome that actually happened. This log score applies to categorical predictions, where one of a (usually) small set of outcomes can happen. On Metaculus those are Binary and Multiple Choice questions. See the next section for the log scores of continuous questions.</p>
  <p>Higher scores are better:</p>
  <ul className="list-disc ml-6">
    <li>If you predicted 0% on the correct outcome, your score will be <MathJaxWrapper>{`\\(-\\infty\\)`}</MathJaxWrapper> (minus infinity).</li>
    <li>If you predict 100% on the correct outcome, your score will be 0.</li>
  </ul>
  <p>This means that the log score is always negative (for Binary and Multiple Choice questions). This has proved unintuitive, which is one reason why Metaculus uses the <a href="/help/scores-faq/#baseline-score">Baseline</a> and <a href="/help/scores-faq/#peer-score">Peer</a> scores, which are based on the log score but can be positive.</p>
  <p>The log score is proper (see <a href="/help/scores-faq/#proper-scoring">What is a proper scoring rule?</a>). This means that to maximize your score <b>you should predict your true beliefs</b> (see <a href="#extremizing">Can I get better scores by predicting extreme values?</a>).</p>
  <p>One interesting property of the log score: it is much more punitive of extreme wrong predictions than it is rewarding of extreme right predictions. Consider the scores you get for predicting 99% or 99.9%:</p>
  
  <div className="overflow-x-auto">
    <table className="mx-auto w-auto border-collapse">
      <thead>
        <tr className="text-sm font-light">
          <td className="p-4"></td>
          <td className="p-4">99% Yes, 1% No</td>
          <td className="p-4">99.9% Yes, 0.1% No</td>
        </tr>
      </thead>
      <tbody>
        <tr className="text-sm font-light">
          <td className="p-4">Score if outcome = Yes</td>
          <td className="p-4">-0.01</td>
          <td className="p-4">-0.001</td>
        </tr>
        <tr className="text-sm font-light">
          <td className="p-4">Score if outcome = No</td>
          <td className="p-4">-4.6</td>
          <td className="p-4">-6.9</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <p>Going from 99% to 99.9% only gives you a tiny advantage if you are correct (+0.009), but a huge penalty if you are wrong (-2.3). So be careful, and only use extreme probabilities when you&apos;re sure they&apos;re appropriate!</p>
  
  <h2 className="section-header" id="continuous-log-score">What is the log score for continuous questions?</h2>
  <p>Since the domain of possible outcomes for continuous questions is (drum roll) continuous, any outcome has mathematically 0 chance of happening. Thankfully we can adapt the log score in the form:</p>
  <MathJaxWrapper>
    {`\\[
    \\text{log score} = \\ln(\\operatorname{pdf}(outcome))
    \\]`}
  </MathJaxWrapper>
  <p>Where <MathJaxWrapper>{`\\(\\ln\\)`}</MathJaxWrapper> is the natural logarithm and <MathJaxWrapper>{`\\(\\operatorname{pdf}(outcome)\\)`}</MathJaxWrapper> is the value of the predicted <a href="https://en.wikipedia.org/wiki/Probability_density_function">probability density function</a> at the outcome. Note that on Metaculus, all pdfs have a <a href="https://en.wikipedia.org/wiki/Uniform_distribution">uniform distribution</a> of height 0.01 added to them. This prevents extreme log scores.</p>
  <p>This is also a proper scoring rule, and behaves in somewhat similar ways to the log score described above. One difference is that, contrary to probabilities that are always between 0 and 1, <MathJaxWrapper>{`\\(\\operatorname{pdf}\\)`}</MathJaxWrapper> values can be greater than 1. This means that the continuous log score can be greater than 0: in theory it has no maximum value, but in practice Metaculus restricts how sharp pdfs can get (see the maximum scores tabulated below).</p> */}
    </PageWrapper>
  );
}
