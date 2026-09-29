import { defineProComments, defineSources, Edition } from "./types";
import {
  DataPoint,
  DiseaseLink,
  Forecast,
  ProComment,
  Term,
  Trend,
} from "../components/tokens";

const SRC = defineSources({
  cdcMeaslesUs2026: {
    source: "cdcMeasles",
    label: "Confirmed US measles cases in 2026",
    value: "3,294",
    asOf: "2026-09-17",
  },
  ecdcMeaslesEea2026: {
    source: "ecdcMeasles",
    label: "Confirmed EU/EEA measles cases in 2026 (data through July)",
    value: "1,754",
    asOf: "2026-07-31",
  },
  cdcEbolaCases: {
    source: "cdcEbola",
    label: "Confirmed Bundibugyo Ebola cases in the DRC outbreak",
    value: "7,200",
    asOf: "2026-09-07",
  },
  cdcEbolaDeaths: {
    source: "cdcEbola",
    label: "Confirmed Bundibugyo Ebola deaths in the DRC outbreak",
    value: "3,475",
    asOf: "2026-09-07",
  },
  usdaScrewworm2026: {
    source: "usdaScrewworm",
    label: "Confirmed US New World screwworm animal cases in 2026",
    value: "49",
    asOf: "2026-09-17",
  },
  ecdcChikFrance: {
    source: "ecdcChikungunya",
    label: "Locally acquired chikungunya cases in France in 2026",
    value: "57",
    asOf: "2026-09-17",
  },
});

const PRO = defineProComments({
  measles: {
    postId: 44970,
    commentId: 1104983,
    author: "Sergio",
    date: "2026-09-08",
    excerpt:
      "With cases still accumulating rapidly in the US this year (and with 2026 at already nearly half over the 2025 total), it becomes increasingly unlikely that the US will see only a few hundred of measles cases in 2027. Vaccination coverage is apparently still falling, and it seems there will continue to be pockets of very low vaccination populations (plus the tail risk of wider spread).",
  },
});

const BUNDIBUGYO_TIP =
  "One of the Ebola virus species, with no licensed vaccine or specific treatment. The 2026 outbreak began in Ituri Province, Democratic Republic of the Congo.";
const EL_NINO_TIP =
  "A warm phase of the Pacific climate cycle. Forecasters expect a strong El Niño to bring milder, wetter conditions to south Texas, which help screwworm survive the winter.";
const SUBCLADE_K_TIP =
  "The H3N2 influenza strain that dominated the 2025/26 season. The 2026/27 vaccine was updated to match it.";

export const EDITION_2026_09_17: Edition = {
  slug: "2026-09-17",
  asOf: "2026-09-17T12:00:00Z",
  takeaways: [
    {
      id: "measles",
      diseases: ["measles"],
      lead: "measlesUs2027",
      content: (
        <>
          The forecast for US <DiseaseLink d="measles">measles</DiseaseLink>{" "}
          cases in 2027{" "}
          <Trend
            v="measlesUs2027"
            up="has risen to"
            down="has fallen to"
            steady="is steady at"
          />{" "}
          <Forecast v="measlesUs2027" change />, driven by a second rise in{" "}
          <Term tip="Confirmed US measles cases in 2026 have already passed the 2025 total.">
            2026
          </Term>{" "}
          cases. The forecast for Europe is{" "}
          <Forecast v="measlesEea2027" change />.
        </>
      ),
    },
    {
      id: "ebola",
      diseases: ["ebola"],
      lead: "ebolaUsCaseBeforeJul2027",
      content: (
        <>
          The chance of a first US case of{" "}
          <Term tip={BUNDIBUGYO_TIP}>Bundibugyo Ebola</Term> before{" "}
          <Term tip="The question counts cases first confirmed in the US before July 1, 2027.">
            July 2027
          </Term>{" "}
          <Trend
            v="ebolaUsCaseBeforeJul2027"
            up="has risen to"
            down="has fallen to"
            steady="remains at"
          />{" "}
          <Forecast v="ebolaUsCaseBeforeJul2027" change />.
        </>
      ),
    },
    {
      id: "screwworm",
      diseases: ["screwworm"],
      lead: "screwwormUs2027",
      content: (
        <>
          The forecast for{" "}
          <DiseaseLink d="screwworm">New World screwworm</DiseaseLink> in 2027{" "}
          <Trend
            v="screwwormUs2027"
            up="has increased to"
            down="has decreased to"
            steady="is steady at"
          />{" "}
          <Forecast v="screwwormUs2027" suffix=" animal cases" change />, partly
          due to the expected impacts of a strong{" "}
          <Term tip={EL_NINO_TIP}>El Niño</Term>.
        </>
      ),
    },
    {
      id: "respiratory",
      diseases: ["respiratory"],
      lead: "respPeakCombined",
      content: (
        <>
          The most likely CDC rating for the{" "}
          <DiseaseLink d="respiratory">flu season</DiseaseLink> is{" "}
          <Forecast v="fluSeverityTop" />, with peak weekly hospital admissions
          per 100,000 of <Forecast v="respPeakInfluenza" /> for influenza and a
          combined peak of <Forecast v="respPeakCombined" /> around{" "}
          <Forecast v="respPeakWeek" />. Early evidence points to a less severe{" "}
          <Term tip="An influenza A subtype. H3N2-dominant seasons have historically leaned more severe.">
            H3N2
          </Term>{" "}
          year than the historical pattern, since{" "}
          <Term tip={SUBCLADE_K_TIP}>subclade K</Term> dominated last season and
          the 2026/27 vaccine was updated to match it.
        </>
      ),
    },
    {
      id: "chikungunya",
      diseases: ["chikungunya"],
      lead: "chikEea2026",
      content: (
        <>
          <DiseaseLink d="chikungunya">Chikungunya</DiseaseLink> estimates for
          Europe{" "}
          <Trend
            v="chikEea2026"
            up="have increased to"
            down="have decreased to"
            steady="are steady at"
          />{" "}
          <Forecast v="chikEea2026" suffix=" cases" change /> after{" "}
          <Term tip="Nearly all locally acquired cases in Europe this year have been in France, with one in Italy.">
            France
          </Term>{" "}
          went from 15 to{" "}
          <DataPoint s={SRC.ecdcChikFrance}>57 local cases</DataPoint> over the
          last month.
        </>
      ),
    },
  ],
  sections: {
    respiratory: {
      body: (
        <>
          <p>
            Forecasters expect peak weekly hospital admissions per 100,000 of{" "}
            <Forecast v="respPeakInfluenza" /> for influenza,{" "}
            <Forecast v="respPeakCovid" /> for COVID-19, and{" "}
            <Forecast v="respPeakRsvInfants" /> for RSV in children under 5,
            with a combined peak of <Forecast v="respPeakCombined" /> around{" "}
            <Forecast v="respPeakWeek" interval />. An early peak before late
            December is largely ruled out, since no season other than post-COVID
            2022/23 has peaked this early.
          </p>
          <p>
            They still expect 2026/27 to be an H3N2-dominant season, putting
            H1N1 at <Forecast v="fluH1n1Share" interval /> of influenza A. This
            H3N2 season is expected to be milder than a typical one, because{" "}
            <Term tip={SUBCLADE_K_TIP}>subclade K</Term> infected enough people
            last season to leave fewer susceptible this year. The forecast for
            the CDC season severity rating is{" "}
            <Forecast v="fluSeverityModerate" /> Moderate,{" "}
            <Forecast v="fluSeverityHigh" /> High,{" "}
            <Forecast v="fluSeverityLow" /> Low or lower, and{" "}
            <Forecast v="fluSeverityVeryHigh" /> Very High or higher.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros are relying on early signals for the coming season. Test
          positivity is slightly higher than the same week last year, and the
          Southern Hemisphere saw an early but mild season in South Africa, a
          light one in Australia and a slightly above-average one in New
          Zealand.
        </p>
      ),
    },
    measles: {
      body: (
        <>
          <p>
            For 2027, forecasters expect <Forecast v="measlesUs2027" interval />{" "}
            measles cases in the US and <Forecast v="measlesEea2027" interval />{" "}
            in Europe. Even the lowest quartile of the US prediction interval is
            higher than every year after 1991, except 2026.
          </p>
          <p>
            The US forecast reflects the second rise of cases in 2026, now at{" "}
            <DataPoint s={SRC.cdcMeaslesUs2026}>3,294 confirmed</DataPoint>.
            Meanwhile, cases in Europe are slowing, with{" "}
            <DataPoint s={SRC.ecdcMeaslesEea2026}>1,754 confirmed</DataPoint>{" "}
            cases in 2026 and fewer in July, the most recent month reported,
            than in any other month. Forecasters put the chance that the US
            loses its measles elimination status before 2027 at{" "}
            <Forecast v="measlesUsElimination" />.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros expect US cases to keep accumulating:{" "}
          <ProComment c={PRO.measles}>
            vaccination coverage is still falling
          </ProComment>{" "}
          and pockets of very low vaccination remain, which makes a return to a
          few hundred cases a year unlikely. For Europe, they expect the recent
          downswing to hold, with a long tail for another major surge.
        </p>
      ),
      quote: PRO.measles,
      sources: [SRC.cdcMeaslesUs2026, SRC.ecdcMeaslesEea2026],
    },
    ebola: {
      body: (
        <>
          <p>
            The outbreak in eastern{" "}
            <Term tip="Democratic Republic of the Congo. The outbreak began in Ituri Province.">
              DRC
            </Term>{" "}
            continues to grow, largely out of control. As of September 7, there
            are <DataPoint s={SRC.cdcEbolaCases}>7,200 confirmed</DataPoint>{" "}
            cases and{" "}
            <DataPoint s={SRC.cdcEbolaDeaths}>3,475 confirmed deaths</DataPoint>
            . Uganda’s outbreak was declared over on August 25 after 42 days
            with no new cases.
          </p>
          <p>
            Forecasters put the chance of a{" "}
            <Forecast v="ebolaUsCaseBeforeJul2027">first US case</Forecast>{" "}
            before July 2027 at <Forecast v="ebolaUsCaseBeforeJul2027" change />
            . They expect <Forecast v="ebolaCasesOutbreakEnd" /> confirmed cases
            by the time the outbreak ends, and the WHO to declare the emergency
            over around <Forecast v="ebolaPheicEnd" />.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros keep the chance of a US case low because a 21-day travel
          restriction is in place and exposed aid workers have been evacuated to
          Germany rather than the US. They also note that contact tracing is
          losing ground, so the outbreak’s eventual size remains highly
          uncertain.
        </p>
      ),
      sources: [SRC.cdcEbolaCases, SRC.cdcEbolaDeaths],
    },
    screwworm: {
      body: (
        <>
          <p>
            The increase in US cases has nearly halted, with{" "}
            <DataPoint s={SRC.usdaScrewworm2026}>49 total confirmed</DataPoint>{" "}
            cases in 2026 but only 4 in August. Forecasters expect{" "}
            <Forecast v="screwwormUs2027" suffix=" animal cases" interval /> in
            2027, reflecting ongoing detections within 100 miles of the border
            in{" "}
            <Term tip="Since 2023 the screwworm fly has moved north through Central America and into Mexico.">
              Mexico
            </Term>
            , which keep creating chances for spillover.
          </p>
          <p>
            Forecasters also widened the upper tail on the possibility that the
            anticipated strong <Term tip={EL_NINO_TIP}>El Niño</Term> brings
            wetter conditions to{" "}
            <Term tip="Nearly all US animal cases have been detected in Texas, starting with a case in Zavala County in June 2026.">
              south Texas
            </Term>
            , improving pupal survival over the winter.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros read the slowdown in detections as a sign that surveillance and
          sterile fly releases are containing the spread, but they keep a long
          upper tail while detections continue near the border and El Niño could
          help flies survive the winter.
        </p>
      ),
      sources: [SRC.usdaScrewworm2026],
    },
    chikungunya: {
      body: (
        <p>
          There was a sudden jump in case numbers in France, for a total of{" "}
          <DataPoint s={SRC.ecdcChikFrance}>57 confirmed</DataPoint> in France
          and one in Italy, though the most recent 12 cases were only recently
          confirmed and may not be reflected in this month’s forecasts.
          Forecasters expect{" "}
          <Forecast v="chikEea2026" suffix=" locally acquired cases" interval />{" "}
          in 2026.
        </p>
      ),
      proSummary: (
        <p>
          Pros see warmer and wetter weather than usual in the coming months as
          the main upside risk, since it encourages mosquito populations.
        </p>
      ),
      sources: [SRC.ecdcChikFrance],
    },
    h5: {
      body: (
        <p>
          Forecasters give a <Forecast v="h5Pheic" change /> chance that the WHO
          declares an H5 virus a{" "}
          <Term tip="WHO’s highest alert under the International Health Regulations, for an extraordinary event that risks spreading internationally and may need a coordinated response.">
            Public Health Emergency of International Concern
          </Term>{" "}
          before 2028.
        </p>
      ),
      proSummary: (
        <p>
          Pros hold the probability low because there has been no human-to-human
          transmission, no US case since November 2025, and only one influenza
          emergency declaration ever. They resist going lower because a
          declaration has a lower bar than a pandemic, and ongoing spillover
          keeps the mutation risk above zero.
        </p>
      ),
    },
  },
  frozen: {
    measlesUs2027: { value: 4494, lower: 2783, upper: 7179 },
    measlesEea2027: { value: 3284, lower: 1900, upper: 6088 },
    ebolaUsCaseBeforeJul2027: { value: 0.1 },
    screwwormUs2027: { value: 49, lower: 21, upper: 105 },
    respPeakInfluenza: { value: 10.8 },
    respPeakCovid: { value: 1.73 },
    respPeakRsvInfants: { value: 19.9 },
    respPeakRsvElderly: { value: 10.3 },
    respPeakCombined: { value: 15.5 },
    respPeakWeek: {
      value: 1798934400,
      lower: 1797984000,
      upper: 1800662400,
    },
    fluH1n1Share: { value: 35.1, lower: 15.9, upper: 60.2 },
    fluSeverityTop: { value: 0.672, option: "Moderate" },
    fluSeverityModerate: { value: 0.672 },
    fluSeverityHigh: { value: 0.19 },
    fluSeverityLow: { value: 0.121 },
    fluSeverityVeryHigh: { value: 0.017 },
    chikEea2026: { value: 98, lower: 75, upper: 129 },
    h5Pheic: { value: 0.06 },
  },
};
