import PageWrapper from "../../components/pagewrapper";

export default function PredictionResources() {
  return (
    <PageWrapper>
      <h1>Prediction Resources</h1>
      <ul className="label-font">
        <li>
          <a href="#analysis-tools">Analysis tools</a>
        </li>
        <li>
          <a href="#text-books">Tutorials, textbooks and other resources</a>
        </li>
        <li>
          <a href="#research">Research on forecasting</a>
        </li>
        <li>
          <a href="#advice">Tips on how to become a better predictor</a>
        </li>
        <li>
          <a href="#data-sources">Data sources</a>
        </li>
      </ul>
      <hr />
      <h2 className="section-header" id="analysis-tools">
        Analysis tools
      </h2>
      <ul className="space-y-6 text-gray-700">
        <li>
          <h3 className="mb-2 text-lg font-bold">
            <a
              href="https://www.getguesstimate.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Guesstimate
            </a>
          </h3>
          <p className="mb-4">
            A simple web-based tool to model uncertainties in calculations.
            Guesstimate&apos;s interface is similar to other spreadsheet tools,
            such as Excel or Google Sheets. Each model is a grid of cells, and
            each cell can be filled with a name and value. Functions can be used
            to connect cells together to represent more complex quantities.
          </p>
          <p className="mb-4">
            For example, consider the{" "}
            <a
              href="https://www.metaculus.com/questions/1337"
              target="_blank"
              rel="noopener noreferrer"
            >
              question series
            </a>{" "}
            about the Fermi paradox. We may use the Drake equation (a &quot;back
            of the envelope&quot; estimation to find out if there is intelligent
            life in the Milky Way other than us humans) to estimate the number
            of intelligent civilizations in our milky verse based on 7 different
            variables (see{" "}
            <a
              href="https://en.wikipedia.org/wiki/Drake_equation"
              target="_blank"
              rel="noopener noreferrer"
            >
              drake equation
            </a>
            ). Each guess has its own uncertainties, and with Guesstimate you
            can multiply the guesses and their uncertainties together to get a
            probability distribution of the number of intelligent civilizations.
            See the following{" "}
            <a
              href="https://www.getguesstimate.com/models/2734"
              target="_blank"
              rel="noopener noreferrer"
            >
              model by a Guesstimate user on this probability
            </a>
            . Also check out{" "}
            <a
              href="https://www.getguesstimate.com/models"
              target="_blank"
              rel="noopener noreferrer"
            >
              public models
            </a>
            .
          </p>
          <p className="font-semibold">
            Don&apos;t forget to post your models in the comments of questions
            for others to see!
          </p>
        </li>

        <li>
          <h3 className="mb-2 text-lg font-bold">
            Spreadsheets such as Excel or{" "}
            <a
              href="https://www.google.com/sheets/about/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Sheets
            </a>
          </h3>
          <p className="mb-4">
            For both theoretical modelling and basic statistical analysis.
            Spreadsheets offer similar options to Guesstimate, as you can create
            theoretical models to factorize questions, produce estimates for
            subquestions, and run basic Monte Carlo simulations (see{" "}
            <a
              href="https://www.youtube.com/watch?v=Nb63swYetzY"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>{" "}
            for an example of such simulation). Secondly, basic statistical
            analysis (descriptive statistics, correlations, regressions and so
            on) is convenient in Excel (see{" "}
            <a
              href="https://ire.org/media/uploads/car2013_tipsheets/excel_stats_nicar2013.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>{" "}
            for more information). Finally, spreadsheets created on{" "}
            <a
              href="https://www.google.com/sheets/about/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Sheets
            </a>{" "}
            can also be shared in the comments, to allow others to view your
            work.
          </p>
        </li>

        <li>
          <h3 className="mb-2 text-lg font-bold">Statistical Software</h3>
          <p>
            Like{" "}
            <a
              href="https://www.r-project.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              R
            </a>
            , for more advanced statistical computing (linear and nonlinear
            modeling, classic statistical tests, time-series analysis,
            classification, clustering) and graphics. You can download it{" "}
            <a
              href="http://cran.us.r-project.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>{" "}
            for free.
          </p>
        </li>

        <li>
          <h3 className="mb-2 text-lg font-bold">
            Probability Distribution Calculators
          </h3>
          <p>
            Such as the{" "}
            <a
              href="https://stattrek.com/online-calculator/normal.aspx"
              target="_blank"
              rel="noopener noreferrer"
            >
              Normal distribution calculator
            </a>
            , the{" "}
            <a
              href="https://stattrek.com/online-calculator/binomial.aspx"
              target="_blank"
              rel="noopener noreferrer"
            >
              Binomial distribution calculator
            </a>
            , and the{" "}
            <a
              href="https://stattrek.com/online-calculator/poisson.aspx"
              target="_blank"
              rel="noopener noreferrer"
            >
              Poisson distribution calculator
            </a>
            . Lastly, check out this{" "}
            <a
              href="https://stattrek.com/online-calculator/bayes-rule-calculator.aspx"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bayes Rule Calculator
            </a>{" "}
            for updating your credence for yes/no questions given new
            information.
          </p>
        </li>

        <li>
          <h3 className="mb-2 text-lg font-bold">
            <a
              href="https://hash.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              HASH
            </a>
          </h3>
          <p>
            System modeling software can generate and inform forecasts of
            complex systems. HASH can be used to represent complex systems and
            run &quot;what-if&quot; scenarios, to hone your intuitions and
            improve your predictions.
          </p>
        </li>
      </ul>
      <h2 className="mb-6 text-2xl font-bold" id="text-books">
        Tutorials, textbooks and other resources
      </h2>

      <ul className="space-y-6">
        <li>
          <p>
            Join the{" "}
            <a href="https://socialscienceprediction.org/?">
              Social Science Prediction Platform
            </a>
            , which supports the &quot;systematic collection and assessment of
            expert forecasts of the effects of untested social programs.&quot;
            It is designed to assist policy makers and social scientists by
            improving the accuracy of forecasts, thereby leading to more
            effective decision-making and improvements to experimental design
            and analysis.
          </p>
        </li>

        <li>
          <p>
            Play{" "}
            <a href="https://www.openphilanthropy.org/calibration?fbclid=IwAR2-__1Iz1jcb4gvHope66JRuDzz0WgHKki_KxIrIgxeap06flC3gT1NyJY">
              Calibrate Your Judgment
            </a>
            , an interactive calibration tutorial produced by the
            OpenPhilanthropy Project. This is perhaps the most useful free
            online calibration training currently available. Note that you must
            sign in with a GuidedTrack, Facebook, or Google account, so that the
            application can track your performance over time.
          </p>
        </li>

        <li>
          <p>
            AI Impact&apos;s{" "}
            <a href="https://aiimpacts.org/evidence-on-good-forecasting-practices-from-the-good-judgment-project/">
              Evidence on good forecasting practices from the Good Judgment
              Project
            </a>{" "}
            summarizes the findings of the Good Judgment Project, the winning
            team in IARPA&apos;s 2011-2015 forecasting tournament. The article
            describes the various correlates of successful forecasting as well
            as the heuristics, forecasting methodologies, philosophical
            outlooks, thinking styles that were associated with better
            predictions. Furthermore, it includes a helpful &quot;recipe&quot;
            for making predictions that describes how superforecasters (top 0.2%
            of forecasters) go about making their predictions.
          </p>
        </li>

        <li>
          <p>
            <a href="https://otexts.org/fpp2/index.html">
              Forecasting: Principles and Practice
            </a>{" "}
            provides a comprehensive introduction to forecasting methods and
            present enough information about each method for readers to use them
            sensibly. The book is easy to read, is concise and presumes only
            basic statistics knowledge.
          </p>

          <p className="mt-4">
            The book presents key concepts of forecasting. From{" "}
            <a href="https://otexts.org/fpp2/judgmental.html">
              judgmental forecasting
            </a>{" "}
            (which can be useful when you have no or few data) to{" "}
            <a href="https://otexts.org/fpp2/regression.html">
              simple/multiple regression
            </a>
            ,{" "}
            <a href="https://otexts.org/fpp2/decomposition.html">
              time series decomposition
            </a>
            ,{" "}
            <a href="https://otexts.org/fpp2/expsmooth.html">
              exponential smoothing (ETS)
            </a>
            , and a few more advanced topics such as{" "}
            <a href="https://otexts.org/fpp2/nnetar.html">Neural Networks</a>{" "}
            (all in R). The book is optimized for providing useful advice on the
            making of predictions, and does not attempt to give a thorough
            discussion of the theoretical details behind each method.
          </p>
        </li>

        <li>
          <p>
            <a href="https://www.sas.upenn.edu/~fdiebold/Textbooks.html?fbclid=IwAR0ecodC_bGr8bxDtAgEy1ziiI8ohocH0S0IBE-Qvah3m46f1uVnNM3MtZo">
              Open Textbooks on Forecasting and Related Courses by Francis
              Diebold
            </a>
            , and especially his{" "}
            <a href="https://www.sas.upenn.edu/~fdiebold/Teaching221/econ221Penn.html">
              Time-Series Econometrics: Forecasting
            </a>
            , which provides an upper-level undergraduate / masters-level
            introduction to forecasting, broadly defined to include all aspects
            of predictive modeling, in economics and related fields. Having used
            this book for my macroeconometrics course, I highly recommend this
            book especially for the modeling of autoregressive processes for
            making point and density forecasts (which are especially useful to
            numeric-range predictions on Metaculus).
          </p>

          <p className="mt-4">
            The topics covered include: regression from a predictive viewpoint;
            conditional expectations vs. linear projections; decision
            environment and loss function; the forecast object, statement,
            horizon and information set; the parsimony principle, relationships
            among point, interval and density forecasts, and much more. The{" "}
            <a href="https://www.sas.upenn.edu/~fdiebold/Teaching221/Forecasting.pdf">
              book can be found here
            </a>
            , and the{" "}
            <a href="https://www.sas.upenn.edu/~fdiebold/Teaching221/Slides.pdf">
              lecture slides covering material in the book can be found here
            </a>
            . Diebold&apos;s resources are licensed under Creative Commons.
          </p>
        </li>
      </ul>

      <h2 className="mb-6 text-2xl font-bold" id="research">
        Research on forecasting
      </h2>
      <p className="mb-4">
        Below is a small selection from the extensive research literature on
        forecasting.
      </p>

      <ul className="space-y-4">
        <li>
          <a href="https://www.cambridge.org/core/journals/judgment-and-decision-making/article/developing-expert-political-judgment-the-impact-of-training-and-practice-on-judgmental-accuracy-in-geopolitical-forecasting-tournaments/123EB18425391D05FA6581FDBB3F309F">
            Developing expert political judgment: The impact of training and
            practice on judgmental accuracy in geopolitical forecasting
            tournaments
          </a>
        </li>
        <li>
          <a href="https://pubsonline.informs.org/doi/10.1287/mnsc.2015.2374">
            Distilling the Wisdom of Crowds: Prediction Markets vs. Prediction
            Polls
          </a>
        </li>
        <li>
          <a href="https://www.researchgate.net/publication/277087515_Identifying_and_Cultivating_Superforecasters_as_a_Method_of_Improving_Probabilistic_Predictions">
            Identifying and Cultivating Superforecasters as a Method of
            Improving Probabilistic Predictions
          </a>
        </li>
        <li>
          <a href="https://academic.oup.com/isq/article/62/2/410/4944059?login=false">
            The Value of Precision in Probability Assessment: Evidence from a
            Large-Scale Geopolitical Forecasting Tournament
          </a>
        </li>
        <li>
          <a href="https://www.science.org/doi/abs/10.1126/science.aal3147">
            Bringing probability judgments into policy debates via forecasting
            tournaments
          </a>
        </li>
        <li>
          <a href="https://journals.sagepub.com/doi/abs/10.1177/0963721414534257?journalCode=cdpa">
            Forecasting Tournaments: Tools for Increasing Transparency and
            Improving the Quality of Debate
          </a>
        </li>
        <li>
          <a href="https://journals.sagepub.com/doi/pdf/10.1177/1745691615598511">
            Improving Intelligence Analysis With Decision Science
          </a>
        </li>
        <li>
          <a href="https://en.wikipedia.org/wiki/Superforecasting:_The_Art_and_Science_of_Prediction">
            Superforecasting: The Art and Science of Prediction
          </a>
        </li>
        <li>
          <a href="https://faculty.wharton.upenn.edu/wp-content/uploads/2022/03/mnsc.2020.3882.pdf">
            Bias, Information, Noise: The BIN Model of Forecasting
          </a>
        </li>
        <li>
          <a href="https://pubmed.ncbi.nlm.nih.gov/30389145/">
            Forecasting tournaments, epistemic humility and attitude
            depolarization
          </a>
        </li>
        <li>
          <a href="https://www.cambridge.org/core/journals/judgment-and-decision-making/article/are-markets-more-accurate-than-polls-the-surprising-informational-value-of-just-asking/B78F61BC84B1C48F809E6D408903E66D">
            Are markets more accurate than polls? The surprising informational
            value of &quot;just asking&quot;
          </a>
        </li>
      </ul>

      <h2 className="mb-6 mt-8 text-2xl font-bold" id="advice">
        Tips on how to become a better predictor
      </h2>
      <ul className="space-y-6">
        <li>
          <h3 className="mb-2 text-xl font-semibold">Avoid overconfidence.</h3>
          <p className="mb-4">
            Overconfidence is a common finding in the forecasting research
            literature, and is found to be present in a 2016 analysis of{" "}
            <a href="https://metaculus.wordpress.com/2016/10/15/analysis-of-20000-predictions/">
              Metaculus predictions.
            </a>{" "}
            Overconfidence comes in many forms, such as overconfidence in
            intuitive judgements, explicit models, or (your or other&apos;s)
            domain-specific expertise.
          </p>
          <p className="mb-4">Generally overconfidence leads people to:</p>
          <ol className="list-inside list-decimal space-y-4 pl-4">
            <li>
              neglect decision aids or other assistance, thereby increasing the
              likelihood of a poor decision. In experimental studies of
              postdiction in which each were provided decision aids,
              subject-level expertise (and thereby confidence) was found to be
              correlated with lower levels of use of reliable decision aids, and{" "}
              <a href="https://link.springer.com/content/pdf/10.1007/978-0-306-47630-3_22.pdf">
                worse predictions overall
              </a>
              .
            </li>
            <li>
              make predictions contrary to the base rate. The base rate is the
              prevalence of a condition in the population under investigation.
              To expect the future to be substantially different from the past,
              one must have good evidence that i) some process crucial to
              bringing the usual result about will fail, and ii) the replacement
              process will produce a different outcome. Bayes rule teaches us
              that to predict unlikely events we must have highly diagnostic
              information (information that you&apos;d be unlikely to observe in
              the usual case) whilst often predictors rely on their confidence
              rather than diagnosticity of evidence in going against the base
              rate.
            </li>
          </ol>
          <p className="mt-4">
            To counteract overconfidence forecasters should heed{" "}
            <span className="font-semibold">five principles</span>:
            <span className="font-semibold">(1)</span> Consider alternatives,
            especially in novel or unprecedented situations for which data is
            lacking;
            <span className="font-semibold">(2)</span> List reasons why the
            forecast might be wrong;
            <span className="font-semibold">(3)</span> In group interaction,
            appoint a devil&apos;s advocate (or play the devil&apos;s advocate
            in the comment section!);
            <span className="font-semibold">(4)</span> Obtain feedback about
            predictions (by posting it in the comments for example);
            <span className="font-semibold">(5)</span> Treat the feedback you
            receive as valuable information.
          </p>
        </li>
        <li>
          <h3 className="mb-2 text-xl font-semibold">
            Break seemingly intractable problems into tractable sub-problems.
          </h3>
          <p>
            This is Fermi-style thinking. Enrico Fermi designed the first atomic
            reactor. When he wasn&apos;t doing that he loved to tackle
            challenging questions such as &quot;How many piano tuners are in
            Chicago?&quot; At first glance, this seems very difficult. Fermi
            started by decomposing the problem into smaller parts and putting
            them into the buckets of knowable and unknowable. By working at a
            problem this way you expose what you don&apos;t know or, as Tetlock
            (2016) puts it, you &quot;flush ignorance into the open.&quot;
          </p>
        </li>
        <li>
          <h3 className="mb-2 text-xl font-semibold">
            Discover the relevant base rate.
          </h3>
          <p>
            A <i>Metaculus time lord</i> knows that there is nothing truly new
            under the sun. So, the best of forecasters often conduct creative
            searches for comparison classes even for seemingly unique events and
            pose the question: How often do things of this sort happen in
            situations of this sort? Identify comparison classes for events, and
            let your predictions be informed by the base-rate of occurrence in
            this class of events. This is often easier and more effective then
            it is to understand the event&apos;s working from first-principles.
          </p>
        </li>
        <li>
          <h3 className="mb-2 text-xl font-semibold">
            Combine systematic &apos;model-thinking&apos; approach with an
            intuition-based approach
          </h3>
          <p className="mb-4">
            Whilst it might be often good to use systematic
            &apos;model-thinking&apos; approach that uses explicit theoretical
            or statistical reasoning, you should generally also use an
            intuition-based approach to predicting. When these two approaches
            yield different answers, think carefully about whether your question
            is the type of question that is better answered with intuitive
            judgments or with systematic modelling, and combine the two answers
            accordingly to inform your prediction. According to{" "}
            <a href="https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow">
              Kahneman
            </a>
            , intuitive judgements about some subject likely to be accurate only
            when the following three conditions hold:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-4">
            <li>The relevant subject exhibits a large degree of regularity</li>
            <li>
              One has had sufficient amount of exposure to this subject to have
              been able to pick up the relevant regularities
            </li>
            <li>
              One has received enough feedback to evaluate previous intuitive
              judgments
            </li>
          </ul>
        </li>
        <li>
          <h3 className="mb-2 text-xl font-semibold">
            Look for the errors behind your mistakes.
          </h3>
          <p>
            It&apos;s easy to justify or rationalize your failure. Don&apos;t.
            Own it and evaluate your track record (both resolution and
            calibration) and compare this the community track record. You want
            to learn where you went wrong and determine ways to get better. And
            don&apos;t just look at failures. Evaluate successes as well so you
            can determine whether you used reliable techniques for producing
            forecasts or whether you were just plain lucky. For example, if you
            have an average log-score above 0.2, this might be evidence of
            overconfidence; in which case you should follow the tips on
            counteracting overconfidence presented above.
          </p>
        </li>
        <li>
          <h3 className="mb-2 text-xl font-semibold">
            Share your work in the question&apos;s comments section.
          </h3>
          <p>
            Sharing your theoretical reasoning (such as posting your Guesstimate
            model), statistical reasoning, information/data sources, or
            dependencies with others is good practice not just because
            you&apos;re providing a valuable public good for our understanding
            of the future, but also because others may supplement your work with
            additional insight.
          </p>
        </li>
      </ul>
      <h2 className="mb-6 text-2xl font-bold" id="data-sources">
        Data Sources
      </h2>
      <h3 className="mb-4 text-xl font-semibold" id="gauss">
        General Data Sources (in no particular order)
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white text-sm dark:border-gray-700 dark:bg-blue-950">
          <thead>
            <tr className="bg-metac-gray-100 dark:bg-metac-gray-900">
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Data Service
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Organization
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Topics
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Size
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Ease of Use
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Comments
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-gray-300 px-4 py-2 text-sm dark:border-gray-700">
                <a
                  href="https://www.google.com/publicdata/directory"
                  className="text-blue-600 hover:underline"
                >
                  Public Data Explorer
                </a>
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Google
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                All topics
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Very large
                <br />
                <br />
                Public Data Explorer aggregates public data from 113 dataset
                providers (such as international organizations, national
                statistical offices, non-governmental organizations, and
                research institutions)
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Very Easy
                <br />
                <br />
                This is a good place to start with your search for data, since
                many datasets are available which are often straightforward to
                find. There are sometimes also great visualizations
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                This is perhaps the best place to look for public data and
                forecasts provided from third-party data providers
                <br />
                <br />
                Highly recommended also is the{" "}
                <a
                  href="https://www.google.com/publicdata/explore?ds=n4ff2muj8bh2a_"
                  className="text-blue-600 hover:underline"
                >
                  International Futures Forecasting Data
                </a>{" "}
                on long-term forecasting and global trend analysis available on
                the Public Data Explorer
              </td>
            </tr>
            {/* Add more rows here following the same pattern */}
          </tbody>
        </table>
      </div>

      <h3 className="mb-4 mt-8 text-xl font-semibold" id="macrofinance-sources">
        Macroeconomic & Financial Only Data Sources (in no particular order)
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white text-sm dark:border-gray-700 dark:bg-blue-950">
          <thead>
            <tr className="bg-metac-gray-100 dark:bg-metac-gray-900">
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Data Service
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Organization
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Topics
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Size
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Ease of Use
              </th>
              <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Comments
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                <a
                  href="https://www.bea.gov/about/index.htm"
                  className="text-blue-600 hover:underline"
                >
                  Bureau of Economic Analysis
                </a>
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                U.S. Department of Commerce
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Official macroeconomic and industry statistics, most notably
                reports about the gross domestic product (GDP) of the United
                States, as well as personal income, corporate profits and
                government spending
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Large
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                Easy
              </td>
              <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700"></td>
            </tr>
            {/* Add more rows here following the same pattern */}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
