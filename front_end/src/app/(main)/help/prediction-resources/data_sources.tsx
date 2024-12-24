import { ReactNode } from "react";

export type DataSource = {
  id: string;
  dataService: ReactNode;
  organization: ReactNode;
  topics: ReactNode;
  size: ReactNode;
  easeOfUse: ReactNode;
  comments: ReactNode;
};

export const GENERIC_DATA_SOURCES: DataSource[] = [
  {
    id: "generic_1",
    dataService: (
      <a
        href="https://www.google.com/publicdata/directory"
        className="text-blue-600 hover:underline"
      >
        Public Data Explorer
      </a>
    ),
    organization: "Google",
    topics: "All topics",
    size: (
      <>
        Very large
        <br />
        <br />
        Public Data Explorer aggregates public data from 113 dataset providers
        (such as international organizations, national statistical offices,
        non-governmental organizations, and research institutions)
      </>
    ),
    easeOfUse: (
      <>
        Very large
        <br />
        <br />
        Public Data Explorer aggregates public data from 113 dataset providers
        (such as international organizations, national statistical offices,
        non-governmental organizations, and research institutions)
      </>
    ),
    comments: (
      <>
        This is perhaps the best place to look for public data and forecasts
        provided from third-party data providers
        <br />
        <br />
        Highly recommended also is the{" "}
        <a
          href="https://www.google.com/publicdata/explore?ds=n4ff2muj8bh2a_"
          className="text-blue-600 hover:underline"
        >
          International Futures Forecasting Data
        </a>{" "}
        on long-term forecasting and global trend analysis available on the
        Public Data Explorer
      </>
    ),
  },
  {
    id: "generic_2",
    dataService: (
      <a
        href="https://ourworldindata.org/"
        className="text-blue-600 hover:underline"
      >
        Our World in Data
      </a>
    ),
    organization:
      "The Oxford Martin Programme on Global Development at the University of Oxford",
    topics:
      "Global living conditions: Health, Food Provision, The Growth and Distribution of Incomes, Violence, Rights, Wars, Culture, Energy Use, Education, and Environmental Changes",
    size: (
      <>
        Small
        <br />
        <br />
        Our World in Data aggregates some hundreds of datasets, all of which are
        organized well and given appropriate context
      </>
    ),
    easeOfUse: (
      <>
        Very Easy
        <br />
        <br />
        There are excellent visualizations. Each topic the quality of the data
        is discussed and, by pointing the visitor to the sources, this website
        is also a database of databases. Covering all of these aspects in one
        resource makes it possible to understand how the observed long-run
        trends are interlinked
      </>
    ),
    comments:
      "Highly recommended for big picture questions about the human condition",
  },
  {
    id: "data_source_3",
    dataService: (
      <a href="https://data.gov/" className="text-blue-600 hover:underline">
        Data.gov
      </a>
    ),
    organization: "Various branches of the U.S. Government",
    topics:
      "Agriculture, Climate, Consumer, Education, Energy, Finance, Health, Manufacturing, Public Safety, Science and Research",
    size: (
      <>
        Very Large
        <br />
        <br />
        Over 285,000 datasets from most federal departments, city governments,
        universities, NGOs, and the private sector.
      </>
    ),
    easeOfUse: (
      <>
        Moderately difficult
        <br />
        <br />
        You need to enter good search queries to get a short list of relevant
        results.
      </>
    ),
    comments: "You can really find data on almost anything.",
  },
  {
    id: "data_source_4",
    dataService: (
      <a
        href="https://data.worldbank.org/"
        className="text-blue-600 hover:underline"
      >
        The World Bank Open Data
      </a>
    ),
    organization: "The World Bank",
    topics:
      "Agriculture & Rural Development, Aid Effectiveness, Climate Change, Economy & Growth, Education, Energy & Mining, Environment, Financial Sector, Gender, Health, Infrastructure, Poverty, Science & Technology, Social Development, Trade, Urban Development",
    size: (
      <>
        Large
        <br />
        <br />
        17,445 Datasets available.
      </>
    ),
    easeOfUse: <>Easy</>,
    comments: (
      <>
        Their datasets on{" "}
        <a href="https://data.worldbank.org/topic/science-and-technology">
          Science & Technology
        </a>{" "}
        might be especially relevant for Metaculus questions.
      </>
    ),
  },
  {
    id: "data_source_5",
    dataService: (
      <a href="https://data.un.org/" className="text-blue-600 hover:underline">
        UNData
      </a>
    ),
    organization: "United Nations Statistics Division",
    topics:
      "Agriculture, Crime, Education, Employment, Energy, Environment, Health, HIV/AIDS, Human Development, Industry, Information and Communication Technology, National Accounts, Population, Refugees, Tourism, Trade, as well as the Millennium Development Goals indicators",
    size: <>Large</>,
    easeOfUse: <>Very Easy</>,
    comments: "Very intuitive interface for dataset searching.",
  },
  {
    id: "data_source_6",
    dataService: (
      <a
        href="https://apps.who.int/gho/data/?theme=main"
        className="text-blue-600 hover:underline"
      >
        Global Health Observatory Data Repository
      </a>
    ),
    organization: "The World Health Organization",
    topics: "Health-related topics",
    size: (
      <>
        Moderately large
        <br />
        <br />
        1000 indicators for its 194 member states.
      </>
    ),
    easeOfUse: (
      <>
        Easy
        <br />
        <br />
        You can browse this data by{" "}
        <a href="https://apps.who.int/gho/data/node.home">theme</a>,{" "}
        <a href="https://apps.who.int/gho/data/node.main">category</a>, or{" "}
        <a href="https://apps.who.int/gho/data/node.imr">indicator</a>.
      </>
    ),
    comments:
      "Excellent for health-related questions, such as those involving pandemics, antimicrobial resistance, and malaria.",
  },
  {
    id: "data_source_7",
    dataService: (
      <a
        href="https://data-explorer.oecd.org/"
        className="text-blue-600 hover:underline"
      >
        OECD Stat
      </a>
    ),
    organization:
      "Organisation for Economic Co-operation and Development (OECD)",
    topics:
      "Technology and Patents, Development, Environment, Globalisation, Finance, Health, Industry, Information and Communication Technology, Productivity, Social Protection and Wellbeing, Transport, and more",
    size: null,
    easeOfUse: (
      <>
        Very easy
        <br />
        <br />
        Their online statistical database permits Google-like keyword search.
      </>
    ),
    comments: "",
  },
];

export const MACROECONOMICS_FINANCE_DATA_SOURCES: DataSource[] = [
  {
    id: "macro_1",
    dataService: (
      <>
        <a
          href="https://www.bea.gov/about/index.htm"
          className="text-blue-600 hover:underline"
        >
          Bureau of Economic Analysis
        </a>
      </>
    ),
    organization: "U.S. Department of Commerce",
    topics:
      "Official macroeconomic and industry statistics, most notably reports about the gross domestic product (GDP) of the United States, as well as personal income, corporate profits and government spending",
    size: "Large",
    easeOfUse: "Easy",
    comments: null,
  },
  {
    id: "macro_2",
    dataService: (
      <a
        href="https://finance.yahoo.com/"
        className="text-blue-600 hover:underline"
      >
        Yahoo Finance
      </a>
    ),
    organization: "Yahoo",
    topics:
      "Financial news, data and commentary including stock quotes, press releases, financial reports",
    size: <>Very Large</>,
    easeOfUse: <>Very Easy</>,
    comments: (
      <>
        Here&apos;s the{" "}
        <a
          href="https://finance.yahoo.com/quote/%5EGSPC/?p=%5EGSPC"
          className="text-blue-600 hover:underline"
        >
          S&P 500
        </a>
      </>
    ),
  },
  {
    id: "macro_3",
    dataService: (
      <a
        href="https://fred.stlouisfed.org/"
        className="text-blue-600 hover:underline"
      >
        Economic Research at the St. Louis Fed
      </a>
    ),
    organization: "St. Louis Fed",
    topics:
      "Money & Banking, Population, Employment, Production, Prices, International Data, Academic data (including the NBER Macrohistory database)",
    size: (
      <>
        Very Large
        <br />
        <br />
        509,000 US and international time series from 87 sources.
      </>
    ),
    easeOfUse: (
      <>
        Very Easy
        <br />
        <br />
        Check out their{" "}
        <a
          href="https://fred.stlouisfed.org/categories"
          className="text-blue-600 hover:underline"
        >
          categories
        </a>{" "}
        for a breakdown of their datasets.
      </>
    ),
    comments: null,
  },
];
