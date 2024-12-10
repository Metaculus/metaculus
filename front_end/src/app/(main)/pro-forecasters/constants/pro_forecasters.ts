import IsabelJuniewiczImage from "../assets/Isabel Juniewicz.png";
import PeterHurfordImage from "../assets/Peter Hurford.png";
import PhilippSchoeneggerImage from "../assets/Philipp Schoenegger.jpeg";
import ScottEastmanImageImage from "../assets/Scott Eastman.jpeg";
import { ProForecaster } from "../types";

export const PRO_FORECASTERS: ProForecaster[] = [
  {
    id: "1",
    name: "Peter Hurford",
    description:
      "Peter Wildeford is the co-founder and Chief Advisory Executive at the Institute for AI Policy and Strategy, a think tank working to secure the benefits and manage the risks of advanced AI. Prior to that, he co-founded Rethink Priorities, a research and implementation group that identifies pressing opportunities to make the world better. He also was a data scientist in industry for five years. He enjoys forecasting avidly in his spare time.",
    linkedInUrl: null,
    image: PeterHurfordImage,
  },
  {
    id: "2",
    name: "Philipp Schoenegger",
    description:
      "Philipp is a postdoctoral researcher at the London School of Economics and Political Science. Prior to this role, he worked as a research analyst at the Forecasting Research Institute and completed a PhD in philosophy and economics at the University of St Andrews. Since 2022, Philipp has been a Pro Forecaster for Metaculus. He is also a forecaster for the Swift Centre, Seldon Capital, and the Social Science Prediction Platform.",
    linkedInUrl:
      "https://www.linkedin.com/in/philipp-schoenegger-phd-755117211/",
    image: PhilippSchoeneggerImage,
  },
  {
    id: "3",
    name: "Isabel Juniewicz",
    description:
      "Isabel is a Research Fellow at Open Philanthropy, working on the Cause Prioritization team in Global Catastrophic Risks. Previously, she worked at the Forethought Foundation for Global Priorities Research and has research experience with the Federal Reserve Board. Isabel began graduate studies in economics at UCLA, leaving with a master’s degree. Her work focuses on prioritizing impactful projects that address global challenges.",
    linkedInUrl: "https://www.linkedin.com/in/isabel-juniewicz-50867135/",
    image: IsabelJuniewiczImage,
  },
  {
    id: "4",
    name: "Scott Eastman",
    description:
      "Scott is a geopolitical forecaster and analyst whose insights have been sought by governments, financial institutions, and philanthropies worldwide. He has worked on issues ranging from AI and nuclear risk to climate change and geopolitical conflicts. A member of epidemicforecasting.org, Scott has advised governments on crises like the Covid pandemic. Based between Romania and the U.S., he has traveled to 40+ countries to share his expertise on global risk.",
    linkedInUrl: "https://www.linkedin.com/in/scott-eastman-35942356/",
    image: ScottEastmanImageImage,
  },
];
