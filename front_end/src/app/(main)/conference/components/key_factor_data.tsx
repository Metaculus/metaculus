interface KeyFactorAnalysis {
  results: {
    mainFinding: string;
    numeratorSize: string;
    denominatorSize: string;
    dateRange: string;
  };
  background: string;
  numerator: {
    size: number;
    definition: string;
    validInstances: Array<{
      name: string;
      criteria: {
        dateRange: boolean;
        occurrence: boolean;
        officialRecord: boolean;
        impact: boolean;
      };
    }>;
    invalidInstances: Array<{
      name: string;
      criteria: {
        dateRange: boolean;
        occurrence: boolean;
        officialRecord: boolean;
        impact: boolean;
      };
    }>;
  };
  denominator: {
    size: number;
    definition: string;
    facts: string[];
    estimationSteps: string[];
  };
}

const sampleKeyFactor: KeyFactorAnalysis = {
  results: {
    mainFinding:
      "Chances of US presidential elections with faithless electors: 8.4746% per US presidential elections",
    numeratorSize:
      "5 US presidential elections with faithless electors between January 7, 1789 and October 29, 2024",
    denominatorSize:
      "59 US presidential elections between January 7, 1789 and October 29, 2024",
    dateRange:
      "Jan 07, 1789 to Oct 29, 2024 | 86127 days, 2870.90 months, 235.96 years",
  },
  background:
    "Faithless electors have been a rare occurrence in U.S. presidential elections. According to the National Archives, faithless votes were cast in the 2016 election in Hawaii, Texas, and Washington. Historically, faithless electors have appeared in a small number of elections. For example, in 2016, there were seven faithless electors, which was the highest number since 1972. However, no elector has ever been prosecuted for failing to vote as pledged, although some were disqualified and replaced, and others fined in 2016.",
  numerator: {
    size: 5,
    definition: "US presidential elections with faithless electors",
    validInstances: [
      {
        name: "US Presidential Election of 1836",
        criteria: {
          dateRange: true,
          occurrence: true,
          officialRecord: true,
          impact: true,
        },
      },
      {
        name: "US Presidential Election of 2016",
        criteria: {
          dateRange: true,
          occurrence: true,
          officialRecord: true,
          impact: true,
        },
      },
      {
        name: "1872 Election",
        criteria: {
          dateRange: true,
          occurrence: true,
          officialRecord: true,
          impact: true,
        },
      },
      {
        name: "1836 Election - Virginia Electors",
        criteria: {
          dateRange: true,
          occurrence: true,
          officialRecord: true,
          impact: true,
        },
      },
      {
        name: "2016 Election - Various Electors",
        criteria: {
          dateRange: true,
          occurrence: true,
          officialRecord: true,
          impact: true,
        },
      },
    ],
    invalidInstances: [
      {
        name: "US Presidential Election of 1796",
        criteria: {
          dateRange: true,
          occurrence: false,
          officialRecord: false,
          impact: false,
        },
      },
      {
        name: "US Presidential Election of 1820",
        criteria: {
          dateRange: true,
          occurrence: false,
          officialRecord: false,
          impact: false,
        },
      },
      {
        name: "1968 Election - Lloyd W. Bailey",
        criteria: {
          dateRange: true,
          occurrence: true,
          officialRecord: true,
          impact: false,
        },
      },
      {
        name: "1972 Election - Roger L. MacBride",
        criteria: {
          dateRange: true,
          occurrence: true,
          officialRecord: true,
          impact: false,
        },
      },
    ],
  },
  denominator: {
    size: 59,
    definition: "US presidential elections",
    facts: [
      "Faithless electors have been a rare occurrence in U.S. presidential elections.",
      "According to the National Archives, faithless votes were cast in the 2016 election in Hawaii, Texas, and Washington",
      "In 2016, there were seven faithless electors, which was the highest number since 1972",
      "No elector has ever been prosecuted for failing to vote as pledged",
      "The general election is held every four years on the Tuesday after the first Monday in November",
    ],
    estimationSteps: [
      "There have been 59 presidential elections in U.S. history as of 2020.",
      "Presidential elections occur every four years.",
      "The first U.S. presidential election was in 1788.",
      "Calculate the number of elections from 1788 to 2020: (2020 - 1788) / 4 + 1 = 59 elections.",
    ],
  },
};

export const keyFactorsData: Record<number, KeyFactorAnalysis> = {
  11589: sampleKeyFactor,
  27902: sampleKeyFactor,
  28072: sampleKeyFactor,
  18546: sampleKeyFactor,
};
