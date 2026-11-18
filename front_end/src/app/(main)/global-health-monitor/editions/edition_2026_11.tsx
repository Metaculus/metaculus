import { defineSources, Edition } from "./types";
import {
  DataPoint,
  DiseaseLink,
  Forecast,
  Term,
  Trend,
} from "../components/tokens";

const FLUVIEW_WEEK_44 =
  "https://www.cdc.gov/fluview/surveillance/2026-week-44.html";
const ECDC_SEPTEMBER =
  "https://www.ecdc.europa.eu/en/public-health-events/2011-eip-00003/2026-11-06";

const SRC = defineSources({
  cdcFluPositivity: {
    source: "cdcFluView",
    label: "Clinical lab specimens positive for influenza (week ending Nov 7)",
    value: "11.3%",
    asOf: "2026-11-07",
    url: FLUVIEW_WEEK_44,
  },
  cdcFluH1n1: {
    source: "cdcFluView",
    label: "Subtyped influenza A specimens that are H1N1 (week ending Nov 7)",
    value: "98.9%",
    asOf: "2026-11-07",
    url: FLUVIEW_WEEK_44,
  },
  cdcFluAdmissions: {
    source: "cdcFluView",
    label: "Influenza hospital admissions (week ending Nov 7)",
    value: "9,584",
    asOf: "2026-11-07",
    url: FLUVIEW_WEEK_44,
  },
  cdcMeaslesUs2026: {
    source: "cdcMeasles",
    label: "Confirmed US measles cases in 2026",
    value: "5,412",
    asOf: "2026-11-12",
  },
  ecdcMeaslesEea2026: {
    source: "ecdcMeasles",
    label: "EU/EEA measles cases in 2026 (data through September)",
    value: "1,963",
    asOf: "2026-09-30",
    url: ECDC_SEPTEMBER,
  },
  ecdcMeaslesSeptember: {
    source: "ecdcMeasles",
    label: "EU/EEA measles cases in September 2026",
    value: "66",
    asOf: "2026-09-30",
    url: ECDC_SEPTEMBER,
  },
  ecdcMeasles12Months: {
    source: "ecdcMeasles",
    label: "EU/EEA measles cases in the 12 months through September 2026",
    value: "2,325",
    asOf: "2026-09-30",
    url: ECDC_SEPTEMBER,
  },
  pahoUsElimination: {
    source: "paho",
    label: "The US has lost its measles elimination status",
    value: "Status lost",
    asOf: "2026-11-17",
    url: "https://www.paho.org/en/news/17-11-2026-paho-urges-countries-step-efforts-stop-measles-outbreaks-and-move-towards",
  },
  cdcEbolaCases: {
    source: "cdcEbola",
    label: "Confirmed Bundibugyo Ebola cases in the outbreak, all countries",
    value: "11,145",
    asOf: "2026-11-10",
  },
  cdcEbolaDeaths: {
    source: "cdcEbola",
    label: "Confirmed Bundibugyo Ebola deaths in the outbreak, all countries",
    value: "5,437",
    asOf: "2026-11-10",
  },
  whoEbolaVaccines: {
    source: "whoOutbreakNews",
    label: "Bundibugyo-specific candidate vaccines joining WHO’s Ebola trial",
    value: "2",
    asOf: "2026-11-04",
    url: "https://www.who.int/news/item/04-11-2026-two-new-candidate-vaccines-to-join-ebola-trial-as-treatment-research-advances",
  },
  usdaScrewworm2026: {
    source: "usdaScrewworm",
    label: "Confirmed US New World screwworm animal cases in 2026",
    value: "139",
    asOf: "2026-11-14",
    url: "https://www.aphis.usda.gov/node/7944/current-status",
  },
  spfChikFrance: {
    source: "spfChikungunya",
    label: "Locally acquired chikungunya cases in mainland France in 2026",
    value: "214",
    asOf: "2026-11-09",
    url: "https://www.santepubliquefrance.fr/maladies-a-transmission-vectorielle/chikungunya/bulletin-national/chikungunya-dengue-zika-et-29",
  },
});

const DRC_TIP =
  "Democratic Republic of the Congo. The outbreak began in Ituri Province.";

export const EDITION_2026_11: Edition = {
  slug: "2026-11",
  asOf: "2026-11-18T12:00:00Z",
  // Section order and cards, as published.
  layout: [
    {
      id: "respiratory",
      cards: [
        { postId: 44971 },
        { postId: 45086, value: "respPeakWeek" },
        { postId: 44967, value: "fluSeverityTop" },
        { postId: 44977, value: "fluH1n1Share" },
      ],
    },
    {
      id: "measles",
      cards: [
        { postId: 44970 },
        { postId: 42089, value: "measlesUs2026" },
        { postId: 42477, value: "measlesUsHospitalization2026" },
        { postId: 42517, value: "measlesUsElimination" },
      ],
    },
    {
      id: "ebola",
      cards: [
        { postId: 45008, value: "ebolaUsCaseBeforeJul2027" },
        { postId: 43726 },
      ],
    },
    {
      id: "screwworm",
      cards: [
        { postId: 44965, value: "screwwormUs2027" },
        { postId: 43869, value: "screwwormUs2026" },
      ],
    },
    { id: "chikungunya", cards: [{ postId: 45018, value: "chikEea2026" }] },
    {
      id: "h5",
      layout: "column",
      cards: [{ postId: 45011, value: "h5Pheic" }],
    },
    {
      id: "plague",
      layout: "column",
      cards: [{ postId: 45987, value: "plagueRussiaFatalities" }],
    },
  ],
  takeaways: [
    {
      id: "screwworm",
      diseases: ["screwworm"],
      lead: "screwwormUs2027",
      content: (
        <>
          Forecasters{" "}
          <Trend
            v="screwwormUs2027"
            up="more than tripled their 2027 estimate to"
            down="lowered their 2027 estimate to"
            steady="held their 2027 estimate at"
          />{" "}
          <Forecast v="screwwormUs2027" suffix=" US animal cases" change />{" "}
          after cases surged and spread into New Mexico and Arizona. The US has
          now confirmed{" "}
          <DataPoint s={SRC.usdaScrewworm2026}>139 cases</DataPoint> this year,
          53 of them in the first 2 weeks of November.
        </>
      ),
    },
    {
      id: "measles",
      diseases: ["measles"],
      lead: "measlesUsElimination",
      content: (
        <>
          On November 17,{" "}
          <DataPoint s={SRC.pahoUsElimination}>PAHO announced</DataPoint> that
          the US has lost its <DiseaseLink d="measles">measles</DiseaseLink>{" "}
          elimination status after 26 years. Mexico and Bolivia lost theirs too.
          US cases passed <DataPoint s={SRC.cdcMeaslesUs2026}>5,400</DataPoint>,
          the most since 1991, and forecasters now expect{" "}
          <Forecast v="measlesUs2026" suffix=" by year end" change />. The 2027
          forecast for Europe{" "}
          <Trend
            v="measlesEea2027"
            up="rose to"
            down="fell to"
            steady="held at"
          />{" "}
          <Forecast v="measlesEea2027" change /> after only{" "}
          <DataPoint s={SRC.ecdcMeaslesSeptember}>66</DataPoint> EU/EEA cases in
          September.
        </>
      ),
    },
    {
      id: "respiratory",
      diseases: ["respiratory"],
      lead: "fluH1n1Share",
      content: (
        <>
          <DiseaseLink d="respiratory">Flu</DiseaseLink> is rising early and
          it’s almost all H1N1. Forecasters put H1N1 at{" "}
          <Forecast v="fluH1n1Share" suffix=" of influenza A" change /> and{" "}
          <Trend
            v="respPeakWeek"
            up="moved the combined hospitalization peak later, to"
            down="moved the combined hospitalization peak a week earlier, to"
            steady="kept the combined hospitalization peak at"
          />{" "}
          <Forecast v="respPeakWeek" />. A Moderate season is still most likely
          (<Forecast v="fluSeverityModerate" />
          ), though High{" "}
          <Trend
            v="fluSeverityHigh"
            up="has edged up to"
            down="has eased to"
            steady="holds at"
          />{" "}
          <Forecast v="fluSeverityHigh" />.
        </>
      ),
    },
    {
      id: "ebola",
      diseases: ["ebola"],
      lead: "ebolaUsCaseBeforeJul2027",
      content: (
        <>
          The outbreak passed{" "}
          <DataPoint s={SRC.cdcEbolaCases}>11,100 confirmed cases</DataPoint>.
          Forecasters{" "}
          <Trend
            v="ebolaUsCaseBeforeJul2027"
            up="raised"
            down="lowered"
            steady="held"
          />{" "}
          the chance of a first US case before{" "}
          <Term tip="The question counts cases first confirmed in the US before July 1, 2027.">
            July 2027
          </Term>{" "}
          <Trend v="ebolaUsCaseBeforeJul2027" up="to" down="to" steady="at" />{" "}
          <Forecast v="ebolaUsCaseBeforeJul2027" />, even though CDC still
          reports no US cases.
        </>
      ),
    },
    {
      id: "chikungunya",
      diseases: ["chikungunya"],
      lead: "chikEea2026",
      content: (
        <>
          France reached{" "}
          <DataPoint s={SRC.spfChikFrance}>214 local cases</DataPoint> by early
          November, and the season ran later than expected. Forecasters now
          expect <Forecast v="chikEea2026" suffix=" cases" change /> for Europe
          in 2026.
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
            <Forecast v="respPeakCovid" /> for COVID-19 (down from 2.7 in
            October) and <Forecast v="respPeakRsvInfants" /> for RSV in children
            under 5 (down from 24.6), with a combined peak of{" "}
            <Forecast v="respPeakCombined" /> around{" "}
            <Forecast v="respPeakWeek" interval />. That’s a week earlier than
            in October.
          </p>
          <p>
            Flu is arriving early and fast. In the week ending November 7,{" "}
            <DataPoint s={SRC.cdcFluPositivity}>11.3%</DataPoint> of clinical
            lab specimens tested positive for influenza, up from 9.1% a week
            earlier, and hospitals reported{" "}
            <DataPoint s={SRC.cdcFluAdmissions}>9,584</DataPoint> flu
            admissions, more than 7 times the same week last season. Five
            children have died of flu so far this season. H1N1 made up{" "}
            <DataPoint s={SRC.cdcFluH1n1}>98.9%</DataPoint> of subtyped
            influenza A. Forecasters now put H1N1 at{" "}
            <Forecast v="fluH1n1Share" interval /> of the season, up from 53.9%
            in October. The forecast for the CDC season severity rating is{" "}
            <Forecast v="fluSeverityModerate" /> Moderate,{" "}
            <Forecast v="fluSeverityHigh" /> High,{" "}
            <Forecast v="fluSeverityLow" /> Low or lower and{" "}
            <Forecast v="fluSeverityVeryHigh" /> Very High or higher. CDC’s own
            preliminary in-season assessment rates severity as low so far.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros say the early H1N1 wave is now beyond doubt, and since flu
          usually drives the combined peak, they’ve moved it earlier. Some now
          see the week after Thanksgiving as the single most likely peak week,
          as happened in the early 2022 season. On severity they split: one Pro
          raised High because late October looks a lot like December 2024, ahead
          of a High season, while others note H1N1 tends to put fewer people in
          hospital and an early, broad wave could mean a lower peak. On strain,
          one Pro pointed out that no US season since 2010 has started as
          H1N1-heavy as this one, and Japan and South Korea are both near 98%
          H1N1. That makes an H3N2 takeover very unlikely, though a smaller H3N2
          wave later in the season is still possible.
        </p>
      ),
      sources: [SRC.cdcFluPositivity, SRC.cdcFluH1n1],
    },
    measles: {
      body: (
        <>
          <p>
            US cases reached{" "}
            <DataPoint s={SRC.cdcMeaslesUs2026}>5,412</DataPoint> as of November
            12, the most since 1991 and more than double all of 2025. About 11%
            of cases have been hospitalized, and CDC has confirmed 6 measles
            deaths this year. Forecasters expect{" "}
            <Forecast v="measlesUs2026" change interval /> US cases by the end
            of 2026, with about <Forecast v="measlesUsHospitalization2026" />{" "}
            hospitalized.
          </p>
          <p>
            On November 17,{" "}
            <DataPoint s={SRC.pahoUsElimination}>PAHO announced</DataPoint> that
            the US has lost its measles elimination status, after measles spread
            continuously for more than 12 months. Mexico and Bolivia also lost
            their status. Forecasters had put the chance at 96% in October. For
            2027, they expect <Forecast v="measlesUs2027" change interval /> US
            cases and <Forecast v="measlesEea2027" change interval /> in Europe.
            EU/EEA countries reported just{" "}
            <DataPoint s={SRC.ecdcMeaslesSeptember}>66 cases</DataPoint> in
            September and{" "}
            <DataPoint s={SRC.ecdcMeasles12Months}>2,325</DataPoint> over the 12
            months to September.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros see US growth speeding up, heading toward about 7,000 cases for
          2026, so they’ve widened the upper end for 2027. Part of the
          late-October jump was backfilled cases from earlier months, which
          keeps some of them from going higher. For Europe, September’s low
          count pushed Pros toward around 2,000 cases in 2027. On elimination
          status, Pros had said since July that the evidence of continuous
          transmission was clear, and only political pressure could have changed
          the outcome.
        </p>
      ),
      sources: [SRC.cdcMeaslesUs2026, SRC.ecdcMeaslesEea2026],
    },
    ebola: {
      body: (
        <>
          <p>
            The outbreak in eastern <Term tip={DRC_TIP}>DRC</Term> keeps
            growing. As of November 10, CDC counts{" "}
            <DataPoint s={SRC.cdcEbolaCases}>11,145 confirmed cases</DataPoint>{" "}
            and <DataPoint s={SRC.cdcEbolaDeaths}>5,437 deaths</DataPoint>{" "}
            across all affected countries, up from 9,235 and 4,444 in
            mid-October. Almost all are in the DRC. Kenya has 9 confirmed cases,
            all linked to one patient, and Nigeria has 1. WHO is{" "}
            <DataPoint s={SRC.whoEbolaVaccines}>
              adding two Bundibugyo-specific vaccines
            </DataPoint>{" "}
            to its trial, since the approved Ebola vaccines target a different
            species.
          </p>
          <p>
            Forecasters{" "}
            <Trend
              v="ebolaUsCaseBeforeJul2027"
              up="raised"
              down="lowered"
              steady="held"
            />{" "}
            the chance of a{" "}
            <Forecast v="ebolaUsCaseBeforeJul2027">first US case</Forecast>{" "}
            before July 2027{" "}
            <Trend v="ebolaUsCaseBeforeJul2027" up="to" down="to" steady="at" />{" "}
            <Forecast v="ebolaUsCaseBeforeJul2027" />, up from 10%. CDC still
            reports no US cases and calls the risk to the US very low.
            Forecasters still expect <Forecast v="ebolaCasesOutbreakEnd" />{" "}
            confirmed cases by the time the outbreak ends.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros keep the chance low but aren’t letting time decay pull it down
          much. CDC’s latest assessment calls a very large, sustained outbreak
          the most likely path through January, and cases have already reached
          Kenya and Nigeria. Against that, US entry rules keep getting stricter:
          since November 3, travelers flying to the US must attest they haven’t
          been in the DRC in the past 21 days.
        </p>
      ),
      sources: [SRC.cdcEbolaCases, SRC.cdcEbolaDeaths],
    },
    screwworm: {
      body: (
        <>
          <p>
            The outbreak flared back up. After just 3 cases in September, USDA
            confirmed 36 in October and 53 in the first 2 weeks of November. The
            US has now confirmed{" "}
            <DataPoint s={SRC.usdaScrewworm2026}>139 animal cases</DataPoint> in
            2026 across Texas, New Mexico and Arizona, which reported its first
            case on October 28. Cases include cattle, horses, sheep, dogs, a cat
            and 2 wild elk, and a Tucson-area horse with no known travel
            history.
          </p>
          <p>
            Forecasters now expect{" "}
            <Forecast v="screwwormUs2027" suffix=" animal cases" interval /> in
            2027, up from 68 in October, and <Forecast v="screwwormUs2026" />{" "}
            for all of 2026. Warm, wet weather has helped the flies, and USDA
            plans to reopen the Nogales, Arizona port to Mexican cattle on
            November 30.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Last month, Pros were below the crowd at 43 to 52 cases. Now they sit
          at 190 to 316. Most of October’s cases turned up outside the zones
          where sterile flies were being released, and Pros don’t think there’s
          spare capacity to scale up releases before new production comes online
          in mid to late 2027. Cases in pets and wild elk point to spread in
          animals that are hard to monitor or treat, so they now see
          overwintering into 2027 as likely. Cold nights in Arizona and New
          Mexico could slow things for a while.
        </p>
      ),
      sources: [SRC.usdaScrewworm2026],
    },
    chikungunya: {
      body: (
        <p>
          Local transmission in France lasted longer than forecasters expected.
          As of November 9, France had{" "}
          <DataPoint s={SRC.spfChikFrance}>
            214 locally acquired cases
          </DataPoint>{" "}
          across 31 clusters, up from 162 in mid-October. Forecasters now expect{" "}
          <Forecast v="chikEea2026" suffix=" locally acquired cases" interval />{" "}
          in the EU/EEA for 2026, up from 214.
        </p>
      ),
      proSummary: (
        <p>
          France kept adding about 20 cases a week through mid-October, with no
          sign of slowing, so Pros raised their range to about 250 to 300. Last
          year’s season ran into mid-November before cold weather stopped it.
        </p>
      ),
      sources: [SRC.spfChikFrance],
    },
  },
};
