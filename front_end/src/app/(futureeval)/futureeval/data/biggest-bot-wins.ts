/**
 * Biggest Bot Wins Data
 *
 * This file contains the data for questions where bots significantly outperformed pros.
 * Edit this file to update the table contents on the Benchmark page.
 *
 * Each quarter has an array of questions with the following fields:
 * - questionTitle: The full question text
 * - prosUrl: URL to the pros forecast page
 * - botsUrl: URL to the bots forecast page
 * - prosForecast: Pros' probability forecast (as decimal, e.g., 0.25 for 25%)
 * - botsForecast: Bots' probability forecast (as decimal, e.g., 0.083 for 8.3%)
 * - didItHappen: Whether the event occurred (true = Yes, false = No)
 * - botsWonBy: Margin of victory for bots (as decimal, e.g., 0.3012 for 30.12%)
 * - whatHappened: 1-2 sentence explanation of the outcome (placeholder for now)
 */

export type BotWinQuestion = {
  questionTitle: string;
  prosUrl: string;
  botsUrl: string;
  prosForecast: number;
  botsForecast: number;
  didItHappen: boolean;
  botsWonBy: number;
  whatHappened: string;
};

export type QuarterData = {
  id: string;
  label: string;
  questions: BotWinQuestion[];
};

export const BIGGEST_BOT_WINS_DATA: QuarterData[] = [
  {
    id: "q2-2025",
    label: "Q2 2025",
    questions: [
      {
        questionTitle:
          "What will be the current drought area of Zimbabwe's Kariba district on June 1, 2025? (31-49)",
        prosUrl:
          "https://www.metaculus.com/questions/37090/what-will-be-the-current-drought-area-of-zimbabwes-kariba-district-on-june-1-2025/",
        botsUrl:
          "https://www.metaculus.com/questions/37029/what-will-be-the-current-drought-area-of-zimbabwes-kariba-district-on-june-1-2025/",
        prosForecast: 0.25,
        botsForecast: 0.083,
        didItHappen: false,
        botsWonBy: 0.3012,
        whatHappened:
          "Experts expected drought in Zimbabwe’s Kariba district to stay stable or improve, but it ended up spreading to a much larger area than predicted.",
      },
      {
        questionTitle:
          "What will be the ranking of the All-In podcast on the Spotify Podcast Charts on June 28, 2025? (61 or more)",
        prosUrl:
          "https://www.metaculus.com/questions/38563/what-will-be-the-ranking-of-the-all-in-podcast-on-the-spotify-podcast-charts-on-june-28-2025/",
        botsUrl:
          "https://www.metaculus.com/questions/38535/what-will-be-the-ranking-of-the-all-in-podcast-on-the-spotify-podcast-charts-on-june-28-2025/",
        prosForecast: 0.293,
        botsForecast: 0.118,
        didItHappen: false,
        botsWonBy: 0.3621,
        whatHappened:
          "Forecasters overestimated how quickly the podcast’s popularity would drop, underestimating how stable chart rankings usually are over short periods.",
      },
      {
        questionTitle:
          "Will the Project 2025 Tracker spreadsheet have the objective of terminating the Public Service Loan Forgiveness program marked as complete before July 1, 2025?",
        prosUrl:
          "https://www.metaculus.com/questions/37683/will-the-project-2025-tracker-spreadsheet-have-the-objective-of-terminating-the-public-service-loan-forgiveness-program-marked-as-complete-before-july-1-2025/",
        botsUrl:
          "https://www.metaculus.com/questions/37643/will-the-project-2025-tracker-spreadsheet-have-the-objective-of-terminating-the-public-service-loan-forgiveness-program-marked-as-complete-before-july-1-2025/",
        prosForecast: 0.5,
        botsForecast: 0.137,
        didItHappen: false,
        botsWonBy: 0.2126,
        whatHappened:
          "A widely discussed plan to end a student loan forgiveness program never reached the point where an official tracker said it was finished before the deadline.",
      },
      {
        questionTitle:
          "How many measures will be passed by the US Congress in June 2025? (greater than 6)",
        prosUrl:
          "https://www.metaculus.com/questions/37863/how-many-measures-will-be-passed-by-the-us-congress-in-june-2025/",
        botsUrl:
          "https://www.metaculus.com/questions/37838/how-many-measures-will-be-passed-by-the-us-congress-in-june-2025/",
        prosForecast: 0.366,
        botsForecast: 0.057,
        didItHappen: false,
        botsWonBy: 0.1288,
        whatHappened:
          "Congress ended up passing a moderate number of laws in June 2025, showing that even during a busy political period, legislative output stayed fairly typical rather than unusually high.",
      },
      {
        questionTitle:
          'How many "Level 4 – Do Not Travel" travel advisories will the US State Department issue in June 2025? (Greater than two)',
        prosUrl:
          "https://www.metaculus.com/questions/38124/how-many-level-4-do-not-travel-travel-advisories-will-the-us-state-department-issue-in-june-2025/",
        botsUrl:
          "https://www.metaculus.com/questions/38052/how-many-level-4-do-not-travel-travel-advisories-will-the-us-state-department-issue-in-june-2025/",
        prosForecast: 0.399,
        botsForecast: 0.133,
        didItHappen: false,
        botsWonBy: 0.2803,
        whatHappened:
          "In June 2025, the U.S. issued two new “Do Not Travel” warnings, which bots predicted accurately by following history, while experts overreacted to global tensions.",
      },
    ],
  },
  {
    id: "q1-2025",
    label: "Q1 2025",
    questions: [
      {
        questionTitle: "Will Elon Musk attend the Super Bowl in 2025?",
        prosUrl:
          "https://www.metaculus.com/questions/34738/will-elon-musk-attend-the-super-bowl-in-2025/",
        botsUrl:
          "https://www.metaculus.com/questions/34686/will-elon-musk-attend-the-super-bowl-in-2025/",
        prosForecast: 0.78,
        botsForecast: 0.2,
        didItHappen: false,
        botsWonBy: 0.1474,
        whatHappened:
          "Experts guessed based on past behavior and rumors, while bots stuck to actual reports and updated in real time.",
      },
      {
        questionTitle:
          "How many hostages will Hamas release after January 26 and before April 5, 2025? (≥40)",
        prosUrl:
          "https://www.metaculus.com/questions/34387/of-hostages-hamas-frees-after-jan-26-before-apr-5-25/",
        botsUrl:
          "https://www.metaculus.com/questions/34274/how-many-hostages-will-hamas-release-after-january-26-and-before-april-5-2025/",
        prosForecast: 0.153,
        botsForecast: 0.051,
        didItHappen: false,
        botsWonBy: 0.3152,
        whatHappened: "—",
      },
      {
        questionTitle:
          "Who will be ranked 2nd on the Forbes Real-Time Billionaires List on March 29, 2025? (Larry Ellison)",
        prosUrl:
          "https://www.metaculus.com/questions/31760/who-will-be-ranked-2nd-on-the-forbes-real-time-billionaires-list-on-march-29-2025/",
        botsUrl:
          "https://www.metaculus.com/questions/31754/who-will-be-ranked-2nd-on-the-forbes-real-time-billionaires-list-on-march-29-2025/",
        prosForecast: 0.232,
        botsForecast: 0.065,
        didItHappen: false,
        botsWonBy: 0.2546,
        whatHappened: "—",
      },
      {
        questionTitle:
          "For how many days will the US federal government be shut down in March 2025? (8 or more)",
        prosUrl:
          "https://www.metaculus.com/questions/35238/for-how-many-days-will-the-us-federal-government-be-shut-down-in-march-2025/",
        botsUrl:
          "https://www.metaculus.com/questions/35183/for-how-many-days-will-the-us-federal-government-be-shut-down-in-march-2025/",
        prosForecast: 0.351,
        botsForecast: 0.062,
        didItHappen: false,
        botsWonBy: 0.148,
        whatHappened: "—",
      },
      {
        questionTitle:
          "What will be the IMDb rating of the Severance season 2 second to last episode? (>9.5)",
        prosUrl:
          "https://www.metaculus.com/questions/35721/what-will-be-the-imdb-rating-of-the-severance-season-2-second-to-last-episode/",
        botsUrl:
          "https://www.metaculus.com/questions/35673/what-will-be-the-imdb-rating-of-the-severance-season-2-second-to-last-episode/",
        prosForecast: 0.193,
        botsForecast: 0.077,
        didItHappen: false,
        botsWonBy: 0.3737,
        whatHappened: "—",
      },
    ],
  },
  {
    id: "q4-2024",
    label: "Q4 2024",
    questions: [
      {
        questionTitle:
          "Will China officially announce export restrictions on any additional metals before January 1, 2025?",
        prosUrl:
          "https://www.metaculus.com/questions/29133/will-china-officially-announce-export-restrictions-on-any-additional-metals-before-january-1-2025/",
        botsUrl:
          "https://www.metaculus.com/questions/29203/will-china-officially-announce-export-restrictions-on-any-additional-metals-before-january-1-2025/",
        prosForecast: 0.35,
        botsForecast: 0.498,
        didItHappen: true,
        botsWonBy: 0.6641,
        whatHappened: "—",
      },
      {
        questionTitle:
          "Will a woman be named the Time Person of the Year for 2024?",
        prosUrl:
          "https://www.metaculus.com/questions/29281/will-a-woman-be-named-the-time-person-of-the-year-for-2024/",
        botsUrl:
          "https://www.metaculus.com/questions/29309/will-a-woman-be-named-the-time-person-of-the-year-for-2024/",
        prosForecast: 0.42,
        botsForecast: 0.3,
        didItHappen: false,
        botsWonBy: 0.6548,
        whatHappened: "—",
      },
    ],
  },
];

export default BIGGEST_BOT_WINS_DATA;
