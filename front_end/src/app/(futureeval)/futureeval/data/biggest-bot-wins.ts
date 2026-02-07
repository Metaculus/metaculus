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
        botsUrl: "/questions/27935/",
        prosUrl: "/questions/27943/",
        botsForecast: 0.62,
        prosForecast: 0.06,
        didItHappen: true,
        whatHappened:
          "Bots correctly anticipated that the dramatic July spike might continue rather than following the historical seasonal decline pattern that the pros relied upon.",
        botQuote: {
          text: "It appears likely that China's youth unemployment rate will remain above 18.0%.",
          author: "mf-bot-gpt-3.5",
          commentUrl: "/questions/27935/#comment-187873",
        },
        proQuote: {
          text: "I agree with other forecasters that the median outcome is a decrease.",
          author: "datscilly",
          commentUrl: "/questions/27943/#comment-187676",
        },
      },
      {
        questionTitle: "Will Elon Musk attend the Super Bowl in 2025?",
        botsUrl: "/questions/34686/",
        prosUrl: "/questions/34738/",
        botsForecast: 0.2,
        prosForecast: 0.78,
        didItHappen: false,
        whatHappened:
          "Bots weighted the status quo outcome more heavily despite Musk's recent Super Bowl attendance pattern, while Pros over-anchored on his 2023–2024 attendance and his association with Trump.",
        botQuote: {
          text: "No current public report indicating that Elon Musk plans to attend the Super Bowl.",
          author: "metac-grok-2-1212",
          commentUrl: "/questions/34686/#comment-264426",
        },
        proQuote: {
          text: "Musk has attended many events that Trump has attended since the election.",
          author: "Jgalt",
          commentUrl: "/questions/34738/#comment-262660",
        },
      },
      {
        questionTitle:
          "Will a Metaculus bot rank in the top 100 of the Q1 2025 Quarterly Cup?",
        botsUrl: "/questions/35181/",
        prosUrl: "/questions/35237/",
        botsForecast: 0.81,
        prosForecast: 0.007,
        didItHappen: true,
        whatHappened:
          "Pros over-anchored on early poor performance — the bots were ranked 277th and 299th at the time. Bots failed to find their current rank and were optimistic about AI progress.",
        botQuote: {
          text: "We were unable to find specific historical rankings... trends indicate that AI models have been competitive",
          author: "metac-exa",
          commentUrl: "/questions/35181/#comment-275483",
        },
        proQuote: {
          text: "metac-GPT4o is at rank #277, metac-o1 at #299... I think they'll continue to be there.",
          author: "Zaldath",
          commentUrl: "/questions/35237/#comment-273905",
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
          "Before October 1, 2024, will there be an armed forces death in a conflict opposing China to Taiwan, the US, the Philippines, or Japan?",
        botsUrl: "/questions/25955/",
        prosUrl: "/questions/25972/",
        botsForecast: 0.3,
        prosForecast: 0.01,
        didItHappen: false,
        whatHappened:
          "Pros assessed that the extremely short timeframe and decades-long historical precedent of avoiding lethal force made armed forces deaths highly unlikely. Bots overestimated the risk by focusing on recent tensions.",
        botQuote: {
          text: "Recent escalations and heightened military activities around Taiwan increase the risk.",
          author: "MWG",
          commentUrl: "/questions/25955/#comment-162653",
        },
        proQuote: {
          text: "This is a rather short time frame... No larger scale conflict involving these parties in decades.",
          author: "MaciekK",
          commentUrl: "/questions/25972/#comment-161335",
        },
      },
      {
        questionTitle:
          "Will Reform UK win the most seats in the 2025 Derbyshire County Council election?",
        botsUrl: "/questions/37011/",
        prosUrl: "/questions/37085/",
        botsForecast: 0.15,
        prosForecast: 0.75,
        didItHappen: true,
        whatHappened:
          "Pros found the Electoral Calculus MRP poll predicting a Reform UK win in Derbyshire. Bots relied on general heuristics about new parties rarely winning, missing the specific polling evidence.",
        botQuote: {
          text: "Reform UK faces substantial challenges... achieving the necessary swing would require a historic shift in voter behavior.",
          author: "jlbot",
          commentUrl: "/questions/37011/#comment-312157",
        },
        proQuote: {
          text: "Electoral Calculus predicted that Reform UK will have control over Derbyshire, not just becoming the largest party.",
          author: "datscilly",
          commentUrl: "/questions/37085/#comment-311470",
        },
      },

      {
        questionTitle:
          "Will the Global Protest Tracker report any protests in Turkey with 10,000+ participants, before July 1, 2025?",
        botsUrl: "/questions/37460/",
        prosUrl: "/questions/37506/",
        botsForecast: 0.837,
        prosForecast: 0.044,
        didItHappen: false,
        whatHappened:
          "Pros identified the nuances of the resolution source, while bots did not.",
        botQuote: {
          text: "Recent events involving over 300,000 protesters... the necessary scale seems readily achievable.",
          author: "jlbot",
          commentUrl: "/questions/37460/#comment-324463",
        },
        proQuote: {
          text: "It does not show the massive protests that followed the arrest of Turkey's main opposition figure",
          author: "RMD",
          commentUrl: "/questions/37506/#comment-323226",
        },
      },
      {
        questionTitle:
          "Will Intel get dropped from the Dow Jones Industrial Average before October 1, 2024?",
        botsUrl: "/questions/28024/",
        prosUrl: "/questions/28026/",
        botsForecast: 0.7,
        prosForecast: 0.17,
        didItHappen: false,
        whatHappened:
          "Pros recognized that despite Intel's poor performance, the short timeframe and patterns of infrequent DJIA changes made removal before October 1 unlikely. Bots overweighted analyst speculation.",
        botQuote: {
          text: "Speculation about Intel's removal from the Dow has intensified.",
          author: "bestworldbot",
          commentUrl: "/questions/28024/#comment-189113",
        },
        proQuote: {
          text: "10 companies in 12 years. About half that time since the last change. We have 21 days left in Sep.",
          author: "MaciekK",
          commentUrl: "/questions/28026/#comment-189047",
        },
      },
      // {
      //   questionTitle:
      //     "Will 0–3 U.S. federal executive department heads be announced by the incoming administration between the election and December 16, 2024?",
      //   botsUrl: "/questions/29784/",
      //   prosUrl: "/questions/29656/",
      //   botsForecast: 0.45,
      //   prosForecast: 0.005,
      //   didItHappen: false,
      //   whatHappened:
      //     "Pros reasoned that Trump's build up to his second-term means he has had time to plan nominations in advance. Bots were significantly more uncertain.",
      //   botQuote: {
      //     text: "There's a good chance we'll see 0–3 appointments in this period.",
      //     author: "mf-bot-sonnet-3.5",
      //     commentUrl: "/questions/29784/#comment-220577",
      //   },
      //   proQuote: {
      //     text: "Profoundly unlikely — it would suggest fundamental cluelessness about how they intend to govern.",
      //     author: "Jgalt",
      //     commentUrl: "/questions/29656/#comment-219643",
      //   },
      // },
      {
        questionTitle:
          "Will US airline passenger volume for the week of Christmas through New Years Eve 2024 be greater than 19 million?",
        botsUrl: "/questions/31034/",
        prosUrl: "/questions/30995/",
        botsForecast: 0.75,
        prosForecast: 0.12,
        didItHappen: false,
        whatHappened:
          "Pros noticed historical growth patterns and recent December data pointed to a total below 19 million, while bots overestimated by focusing on record-breaking individual days and optimistic industry projections.",
        botQuote: {
          text: "Consistent record-breaking patterns... strong advance bookings... good chance of exceeding 19M passengers",
          author: "mf-bot-sonnet-3.5",
          commentUrl: "/questions/31034/#comment-239820",
        },
        proQuote: {
          text: "Numbers were only 3.5% higher than 2023, which would imply... 17.9M.",
          author: "skmmcj",
          commentUrl: "/questions/30995/#comment-239488",
        },
      },
    ],
  },
];

export default BIGGEST_BOT_WINS_DATA;
