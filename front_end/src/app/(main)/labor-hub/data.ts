export const GOVERNMENT_BASELINES = {
  "2025": 0,
  "2027": 0.62,
  "2030": 1.55,
  "2035": 3.09,
};

export const JOBS_DATA = [
  {
    name: "Laborers and Movers",
    post_id: 42626,
    rating: -1.008,
  },
  {
    name: "Construction Workers",
    post_id: 42625,
    rating: -1.219,
  },
  {
    name: "Janitors and Cleaners",
    post_id: 42624,
    rating: -1.098,
  },
  {
    name: "Restaurant Servers",
    post_id: 42623,
    rating: 0.048,
  },
  {
    name: "Law Enforcement",
    post_id: 42622,
    rating: -0.522,
  },
  {
    name: "Physicians",
    post_id: 42621,
    rating: -0.403,
  },
  {
    name: "Registered Nurses",
    post_id: 42620,
    rating: -0.211,
  },
  {
    name: "K-12 Teachers",
    post_id: 42619,
    rating: 0.488,
  },
  {
    name: "Lawyers and Law Clerks",
    post_id: 42618,
    rating: 0.625,
  },
  {
    name: "Services Sales Representatives",
    post_id: 42617,
    rating: 1.926,
  },
  {
    name: "Designers",
    post_id: 42615,
    rating: 0.538,
  },
  {
    name: "Engineers",
    post_id: 42614,
    rating: 0.954,
  },
  {
    name: "Software Developers",
    post_id: 42613,
    rating: 1.23,
  },
  {
    name: "Financial Specialists",
    post_id: 42612,
    rating: 0.992,
  },
  {
    name: "General Managers",
    post_id: 41308,
    rating: -0.024,
  },
];

export const METHODOLOGY_SECTIONS = [
  {
    title: "Interacting with the hub",
    faqs: [
      {
        question: "How often will these forecasts be updated?",
        answer:
          "These forecasts are updated in real-time. As AI developments occur, forecasters will update their predictions and the hub will track how views shift over time as more information comes to light. Each time a forecaster submits a new prediction, the aggregate will be updated if the prediction results in a change in the aggregate, and those updates will be reflected on this page. The narrative descriptions are reviewed and refreshed biweekly.",
      },
      {
        question: "How do I stay up to date with new forecasts?",
        answer:
          'You can click the "Follow" button at the top to get notified when there are substantial updates to the forecasts. This dashboard aims to provide a resource to track developments over time, and provide the latest information each time you return. If you find it useful, please share it with others who could benefit from seeing these forecasts.',
      },
      {
        question:
          "What if I don't see a forecast that I think would be important to have, or have other feedback?",
        answer:
          "Please reach out and let us know! We can't guarantee that your question or feedback will be included, but we want to hear how we can make this resource as useful as possible. You can get in touch with us by emailing support@metaculus.com.",
      },
      {
        question:
          "Can this be expanded to additional focus areas, and how can partners get involved?",
        answer:
          "Yes, this forecasting approach is flexible and can be applied to many different related or unrelated topics. If you would like to explore ways this hub could be expanded, or other areas where forecasts could be valuable, please reach out to us at contact@metaculus.com.",
      },
    ],
  },
  {
    title: "Occupation selection and approach",
    faqs: [
      {
        question: "How were the occupations selected for this analysis?",
        answer:
          "Occupations were selected based on their representation in the U.S. labor market, their potential vulnerability to AI automation, and their importance to the economy. We prioritized occupations that span a range of skill levels and industries to provide a comprehensive view of potential impacts.",
      },
      {
        question: "What methodology was used to assess automation risk?",
        answer:
          "We used a combination of expert forecasts, task-level analysis, and historical automation patterns to assess the risk of AI automation for each occupation. Forecasters evaluated the likelihood that various tasks within each occupation could be automated by AI systems.",
      },
      {
        question: "How do you define 'automation risk' for an occupation?",
        answer:
          "Automation risk refers to the percentage change in employment expected due to AI automation. A negative value indicates expected job loss, while a positive value suggests potential job growth or resilience to automation. The risk assessment considers both direct task replacement and indirect effects on demand for human labor.",
      },
      {
        question: "Are all occupations in the U.S. labor market included?",
        answer:
          "No, we focused on a representative sample of occupations that collectively represent a significant portion of the U.S. workforce. The selected occupations span various sectors and skill levels to provide insights into broader trends while maintaining analytical depth.",
      },
    ],
  },
  {
    title: "Making the forecasts",
    faqs: [
      {
        question: "Who makes these forecasts?",
        answer:
          "These forecasts are made by a diverse community of forecasters on Metaculus, including domain experts, researchers, and individuals with expertise in AI, labor economics, and related fields. The aggregate forecast combines predictions from many individual forecasters.",
      },
      {
        question: "How are individual forecasts aggregated?",
        answer:
          "We use a weighted aggregation method that combines individual forecasts, giving more weight to forecasters who have demonstrated accuracy in similar domains. The aggregation process is designed to produce more accurate predictions than any single forecaster typically achieves.",
      },
      {
        question: "What time horizons are covered by these forecasts?",
        answer:
          "The forecasts cover two time horizons: 2030 and 2035. These timeframes allow us to capture both near-term and medium-term impacts of AI on the labor market, recognizing that automation effects may unfold gradually over time.",
      },
      {
        question: "How do forecasters account for uncertainty?",
        answer:
          "Forecasters provide probability distributions over possible outcomes, not just point estimates. This allows us to capture uncertainty about future developments in AI capabilities, economic conditions, and policy responses. The aggregate forecast reflects this uncertainty through confidence intervals.",
      },
      {
        question: "Can I participate in making these forecasts?",
        answer:
          "Yes! If you're interested in contributing forecasts, you can join the Metaculus community and participate in the relevant forecasting questions. We welcome diverse perspectives and expertise to improve the quality and robustness of our aggregate predictions.",
      },
    ],
  },
];
