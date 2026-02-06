/**
 * Biggest Bot Wins/Losses Data
 *
 * This file contains the data for questions where bots significantly outperformed
 * pro forecasters (bot wins) and where pros significantly outperformed bots (bot losses).
 *
 * Data sourced from bot_wins_pros_anecdotes.json, filtered to binary questions only.
 */

export type Quote = {
  text: string;
  author: string;
  commentUrl: string;
};

export type BotWinQuestion = {
  questionTitle: string;
  prosUrl: string;
  botsUrl: string;
  prosForecast: number;
  botsForecast: number;
  didItHappen: boolean;
  whatHappened: string;
  botQuote: Quote;
  proQuote: Quote;
};

export type CategoryData = {
  id: string;
  label: string;
  questions: BotWinQuestion[];
};

export const BIGGEST_BOT_WINS_DATA: CategoryData[] = [
  {
    id: "bot-wins",
    label: "Bot wins",
    questions: [
      {
        questionTitle:
          "Will China's youth unemployment rate be greater than 18.0 for August 2024?",
        botsUrl: "https://www.metaculus.com/questions/27935/",
        prosUrl: "https://www.metaculus.com/questions/27943/",
        botsForecast: 0.438,
        prosForecast: 0.007,
        didItHappen: true,
        whatHappened:
          "Bots assigned significantly higher probability to the rate exceeding 18.0%, correctly anticipating that the dramatic July spike might continue rather than following the historical seasonal decline pattern that humans heavily relied upon.",
        botQuote: {
          text: "It appears likely that China's youth unemployment rate will remain above 18.0%.",
          author: "mf-bot-2",
          commentUrl:
            "https://www.metaculus.com/questions/27935/#comment-187873",
        },
        proQuote: {
          text: "I agree with other forecasters that the median outcome is a decrease.",
          author: "datscilly",
          commentUrl:
            "https://www.metaculus.com/questions/27943/#comment-187676",
        },
      },
      {
        questionTitle: "Will Elon Musk attend the Super Bowl in 2025?",
        botsUrl: "https://www.metaculus.com/questions/34686/",
        prosUrl: "https://www.metaculus.com/questions/34738/",
        botsForecast: 0.2,
        prosForecast: 0.78,
        didItHappen: false,
        whatHappened:
          "Bots correctly weighted the status quo outcome more heavily despite Musk's recent Super Bowl attendance pattern, while humans over-anchored on his 2023–2024 attendance and his association with Trump.",
        botQuote: {
          text: "No current public report indicating that Elon Musk plans to attend the Super Bowl.",
          author: "metac-grok-2-1212",
          commentUrl:
            "https://www.metaculus.com/questions/34686/#comment-264426",
        },
        proQuote: {
          text: "Musk has attended many events that Trump has attended since the election.",
          author: "Jgalt",
          commentUrl:
            "https://www.metaculus.com/questions/34738/#comment-262660",
        },
      },
    ],
  },
  {
    id: "bot-losses",
    label: "Bot losses",
    questions: [
      {
        questionTitle:
          "Will the Global Protest Tracker report any protests in Turkey with 10,000+ participants, before July 1, 2025?",
        botsUrl: "https://www.metaculus.com/questions/37460/",
        prosUrl: "https://www.metaculus.com/questions/37506/",
        botsForecast: 0.837,
        prosForecast: 0.044,
        didItHappen: false,
        whatHappened:
          "Humans correctly identified that the resolution source had already classified the March 2025 protests as a continuation of earlier protests, making new qualifying entries extremely unlikely, while bots treated them as new events.",
        botQuote: {
          text: "A broad coalition already mobilized... the necessary scale seems readily achievable.",
          author: "jlbot",
          commentUrl:
            "https://www.metaculus.com/questions/37460/#comment-324463",
        },
        proQuote: {
          text: "If these were already included then a flare up won't count towards resolution.",
          author: "RMD",
          commentUrl:
            "https://www.metaculus.com/questions/37506/#comment-323226",
        },
      },
      {
        questionTitle:
          "Will Intel get dropped from the Dow Jones Industrial Average before October 1, 2024?",
        botsUrl: "https://www.metaculus.com/questions/28024/",
        prosUrl: "https://www.metaculus.com/questions/28026/",
        botsForecast: 0.713,
        prosForecast: 0.059,
        didItHappen: false,
        whatHappened:
          "Humans correctly recognized that despite Intel's poor performance, the short timeframe and historical patterns of infrequent DJIA changes made removal before October 1 unlikely. Bots overweighted analyst speculation.",
        botQuote: {
          text: "Speculation about Intel's removal from the Dow has intensified.",
          author: "bestworldbot",
          commentUrl:
            "https://www.metaculus.com/questions/28024/#comment-189113",
        },
        proQuote: {
          text: "10 companies in 12 years. About half that time since the last change. We have 21 days left in Sep.",
          author: "MaciekK",
          commentUrl:
            "https://www.metaculus.com/questions/28026/#comment-189047",
        },
      },
      {
        questionTitle:
          "Will 0–3 U.S. federal executive department heads be announced by the incoming administration between the election and December 16, 2024?",
        botsUrl: "https://www.metaculus.com/questions/29784/",
        prosUrl: "https://www.metaculus.com/questions/29656/",
        botsForecast: 0.45,
        prosForecast: 0.005,
        didItHappen: false,
        whatHappened:
          "Humans correctly recognized that Trump's second-term experience and historical precedent made it extremely unlikely he would announce only 0–3 cabinet positions. Bots were significantly more uncertain.",
        botQuote: {
          text: "There's a good chance we'll see 0–3 appointments in this period.",
          author: "mf-bot-5",
          commentUrl:
            "https://www.metaculus.com/questions/29784/#comment-220577",
        },
        proQuote: {
          text: "Profoundly unlikely — it would suggest fundamental cluelessness about how they intend to govern.",
          author: "Jgalt",
          commentUrl:
            "https://www.metaculus.com/questions/29656/#comment-219643",
        },
      },
      {
        questionTitle:
          "Will US airline passenger volume for the week of Christmas through New Years Eve 2024 be greater than 19 million?",
        botsUrl: "https://www.metaculus.com/questions/31034/",
        prosUrl: "https://www.metaculus.com/questions/30995/",
        botsForecast: 0.75,
        prosForecast: 0.09,
        didItHappen: false,
        whatHappened:
          "Humans correctly recognized that historical growth patterns and recent December data pointed to a total below 19 million, while bots overestimated by focusing on record-breaking individual days and optimistic industry projections.",
        botQuote: {
          text: "Consistent record-breaking patterns and strong advance bookings make exceeding 19 million likely.",
          author: "mf-bot-5",
          commentUrl:
            "https://www.metaculus.com/questions/31034/#comment-239820",
        },
        proQuote: {
          text: "Numbers were only 3.5% higher than 2023, implying about 17.9M — well short of 19M.",
          author: "skmmcj",
          commentUrl:
            "https://www.metaculus.com/questions/30995/#comment-239488",
        },
      },
      {
        questionTitle:
          "Before October 1, 2024, will there be an armed forces death in a conflict opposing China to Taiwan, the US, the Philippines, or Japan?",
        botsUrl: "https://www.metaculus.com/questions/25955/",
        prosUrl: "https://www.metaculus.com/questions/25972/",
        botsForecast: 0.331,
        prosForecast: 0.001,
        didItHappen: false,
        whatHappened:
          "Humans correctly assessed that the extremely short timeframe and decades-long historical precedent of avoiding lethal force made armed forces deaths highly unlikely. Bots overestimated the risk by focusing on recent tensions.",
        botQuote: {
          text: "Recent escalations and heightened military activities around Taiwan increase the risk.",
          author: "MWG",
          commentUrl:
            "https://www.metaculus.com/questions/25955/#comment-162653",
        },
        proQuote: {
          text: "Less than 1/4 of a year. No larger scale conflict involving these parties in decades.",
          author: "MaciekK",
          commentUrl:
            "https://www.metaculus.com/questions/25972/#comment-161335",
        },
      },
    ],
  },
];

export default BIGGEST_BOT_WINS_DATA;
