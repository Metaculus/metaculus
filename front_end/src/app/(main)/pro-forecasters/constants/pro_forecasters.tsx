import IsabelJuniewiczImage from "../assets/Isabel Juniewicz.png";
import PeterWildefordImage from "../assets/Peter Wildeford.png";
import PhilippSchoeneggerImage from "../assets/Philipp Schoenegger.jpeg";
import ScottEastmanImageImage from "../assets/Scott Eastman.jpeg";
import ProForecasterLink from "../components/link";
import { ProForecaster } from "../types";

export const PRO_FORECASTERS: ProForecaster[] = [
  {
    id: "1",
    name: "Peter Wildeford",
    description: (
      <>
        Peter Wildeford is the co-founder and Chief Advisory Executive at the{" "}
        <ProForecasterLink href="https://www.iaps.ai/">
          Institute for AI Policy and Strategy
        </ProForecasterLink>
        , a think tank dedicated to securing the benefits and managing the risks
        of advanced AI. He also co-founded{" "}
        <ProForecasterLink href="https://rethinkpriorities.org/">
          Rethink Priorities
        </ProForecasterLink>
        , a research and implementation group identifying high-impact
        opportunities to improve the world. Prior to that, he was a data
        scientist in industry. Peter’s professional forecasting work focuses on
        artificial intelligence, nuclear risks, Ukraine, and supply chains.
      </>
    ),
    linkedInUrl: "https://www.linkedin.com/in/peterhurford8/",
    image: PeterWildefordImage,
  },
  {
    id: "2",
    name: "Philipp Schoenegger",
    description: (
      <>
        Philipp is a postdoctoral researcher at the London School of Economics
        and Political Science. Previously, he was a research analyst at the
        Forecasting Research Institute and completed a PhD in philosophy and
        economics at the University of St Andrews. Philipp forecasts for Seldon
        Capital, the Social Science Prediction Platform, Swift Centre, and other
        organizations. At Metaculus, Philipp has focused on the future of
        humanity over the{" "}
        <ProForecasterLink
          internal
          href="/notebooks/14965/forecasting-our-world-in-data-the-next-100-years/"
        >
          next 100 years
        </ProForecasterLink>
        , climate change and the future of electric vehicles, predicting the
        success of{" "}
        <ProForecasterLink internal href="/tournament/fro-casting/">
          Focused Research Organization proposals
        </ProForecasterLink>
        , and the future of benchtop DNA synthesis.
      </>
    ),
    linkedInUrl:
      "https://www.linkedin.com/in/philipp-schoenegger-phd-755117211/",
    image: PhilippSchoeneggerImage,
  },
  {
    id: "3",
    name: "Isabel Juniewicz",
    description: (
      <>
        Isabel is a Research Fellow at{" "}
        <ProForecasterLink href="https://www.openphilanthropy.org/">
          Open Philanthropy
        </ProForecasterLink>
        , serving on the Cause Prioritization Team within the{" "}
        <ProForecasterLink href="https://www.openphilanthropy.org/our-global-health-and-wellbeing-and-global-catastrophic-risks-grantmaking-portfolios/">
          Global Catastrophic Risks
        </ProForecasterLink>{" "}
        focus area. She holds a master’s degree in economics from UCLA and was a
        Senior Research Assistant at the Federal Reserve Board of Governors.
        Isabel has contributed to several Metaculus Pro Forecasting projects,
        focusing on artificial intelligence, the conflict in Ukraine, and
        regional supply chains.
      </>
    ),
    linkedInUrl: "https://www.linkedin.com/in/isabel-juniewicz-50867135/",
    image: IsabelJuniewiczImage,
  },
  {
    id: "4",
    name: "Scott Eastman",
    description: (
      <>
        Scott is a geopolitical forecaster and analyst whose predictions have
        been used by senior political officials, leading financial institutions,
        and philanthropies. He has spoken at and led discussions at the National
        Military Academies of Poland and Romania, and he contributed to an
        epidemic forecasting initiative by the Future of Humanity Institute at
        the University of Oxford, advising governments and industry on COVID-19.
        He currently advises on the wars in Ukraine and the Middle East, and at
        Metaculus has focused on artificial intelligence, nuclear risks,
        synthetic biology, the seasonal{" "}
        <ProForecasterLink
          internal
          href="/tournament/respiratory-outlook-24-25/"
        >
          respiratory disease outlook
        </ProForecasterLink>
        , and other topics.
      </>
    ),
    linkedInUrl: "https://www.linkedin.com/in/scott-eastman-35942356/",
    image: ScottEastmanImageImage,
  },
];
