import { MultiYearIndexData } from "@/types/projects";

export const mockMultiYearIndexData: MultiYearIndexData = {
  years: [2026, 2028, 2030],
  series_by_year: {
    "2026": {
      line: [
        { x: 1767614400, y: 2.4 },
        { x: 1768219200, y: -16.3 },
        { x: 1768824000, y: -19.6 },
        { x: 1769428800, y: -12.9 },
        { x: 1770033600, y: -2.1 },
        { x: 1770638400, y: -9.4 },
        { x: 1771243200, y: -7.7 },
        { x: 1771848000, y: -6.0 },
      ],
      status: "open",
    },
    "2028": {
      line: [
        { x: 1830513600, y: 13.0 },
        { x: 1831118400, y: -7.1 },
        { x: 1831723200, y: -6.3 },
        { x: 1832328000, y: -4.4 },
        { x: 1832932800, y: 9.6 },
        { x: 1833537600, y: 1.7 },
        { x: 1834142400, y: -2.9 },
        { x: 1834747200, y: 9.0 },
      ],
      status: "open",
    },
    "2030": {
      line: [
        { x: 1894017600, y: -2.0 },
        { x: 1894622400, y: -0.6 },
        { x: 1895227200, y: 0.9 },
        { x: 1895832000, y: 2.3 },
        { x: 1896436800, y: 3.7 },
        { x: 1897041600, y: 29.1 },
        { x: 1897646400, y: 6.6 },
        { x: 1898251200, y: 8.0 },
      ],
      status: "open",
    },
  },
  dimensions: [
    {
      key: "2026",
      quartiles: { lower25: -20, median: -11, upper75: 8 },
      status: "open",
    },
    {
      key: "2028",
      quartiles: { lower25: -15, median: 0, upper75: -3 },
      status: "open",
    },
    {
      key: "2030",
      quartiles: { lower25: -2, median: 4, upper75: 10 },
      status: "open",
    },
  ],
  weights: {
    "31688": 1.2,
    "31689": 0.9,
    "31707": 1.5,
    "31709": 0.8,
    "31710": 1.1,
    "31711": 0.7,
    "31712": 1.3,
  },
};
