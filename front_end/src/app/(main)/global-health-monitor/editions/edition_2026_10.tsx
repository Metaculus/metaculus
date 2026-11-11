import { defineSources, Edition } from "./types";
import {
  DataPoint,
  DiseaseLink,
  Forecast,
  Term,
  Trend,
} from "../components/tokens";

const FLUVIEW_WEEK_40 =
  "https://www.cdc.gov/fluview/surveillance/2026-week-40.html";

const SRC = defineSources({
  cdcFluPositivity: {
    source: "cdcFluView",
    label: "Clinical lab specimens positive for influenza (week ending Oct 10)",
    value: "5.0%",
    asOf: "2026-10-10",
    url: FLUVIEW_WEEK_40,
  },
  cdcFluH1n1: {
    source: "cdcFluView",
    label: "Subtyped influenza A specimens that are H1N1",
    value: "96.4%",
    asOf: "2026-10-10",
    url: FLUVIEW_WEEK_40,
  },
  cdcMeaslesUs2026: {
    source: "cdcMeasles",
    label: "Confirmed US measles cases in 2026",
    value: "4,410",
    asOf: "2026-10-15",
  },
  ecdcMeaslesEea2026: {
    source: "ecdcMeasles",
    label: "EU/EEA measles cases in 2026 (data through August)",
    value: "1,897",
    asOf: "2026-08-31",
  },
  ecdcMeaslesAugust: {
    source: "ecdcMeasles",
    label: "EU/EEA measles cases in August 2026",
    value: "143",
    asOf: "2026-08-31",
  },
  ecdcMeasles12Months: {
    source: "ecdcMeasles",
    label: "EU/EEA measles cases in the 12 months through August 2026",
    value: "2,335",
    asOf: "2026-08-31",
  },
  cdcEbolaCases: {
    source: "cdcEbola",
    label: "Confirmed Bundibugyo Ebola cases in the outbreak (9,212 in DRC)",
    value: "9,235",
    asOf: "2026-10-15",
  },
  cdcEbolaDeaths: {
    source: "cdcEbola",
    label: "Confirmed Bundibugyo Ebola deaths in the outbreak (4,441 in DRC)",
    value: "4,444",
    asOf: "2026-10-15",
  },
  usdaScrewworm2026: {
    source: "usdaScrewworm",
    label: "Confirmed US New World screwworm animal cases in 2026",
    value: "56",
    asOf: "2026-10-18",
  },
  spfChikFrance: {
    source: "spfChikungunya",
    label: "Locally acquired chikungunya cases in France in 2026",
    value: "162",
    asOf: "2026-10-12",
    url: "https://www.santepubliquefrance.fr/en/vector-borne-diseases/chikungunya/national-bulletin/chikungunya-dengue-zika-and-west-nile-virus-mainland-france-enhanced-surveillance-bulletin-october",
  },
});

const BUNDIBUGYO_TIP =
  "One of the Ebola virus species, with no licensed vaccine or specific treatment. The 2026 outbreak began in Ituri Province, Democratic Republic of the Congo.";
const EL_NINO_TIP =
  "A warm phase of the Pacific climate cycle. Forecasters expect a strong El Niño to bring milder, wetter conditions to south Texas, which help screwworm survive the winter.";
const SUBCLADE_K_TIP =
  "The H3N2 influenza strain that dominated the 2025/26 season. The 2026/27 vaccine was updated to match it.";
const H3N2_TIP =
  "An influenza A subtype. H3N2-dominant seasons have historically leaned more severe.";

export const EDITION_2026_10: Edition = {
  slug: "2026-10",
  asOf: "2026-10-23T12:00:00Z",
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
      id: "respiratory",
      diseases: ["respiratory"],
      lead: "fluH1n1Share",
      content: (
        <>
          Forecasters no longer expect an <Term tip={H3N2_TIP}>H3N2</Term>
          -dominant <DiseaseLink d="respiratory">flu season</DiseaseLink>. They
          now put H1N1 at{" "}
          <Forecast v="fluH1n1Share" suffix=" of influenza A" change /> after
          flu arrived early and almost all of it was H1N1. The most likely CDC
          rating is still <Forecast v="fluSeverityTop" />, with a combined peak
          of <Forecast v="respPeakCombined" /> around{" "}
          <Forecast v="respPeakWeek" />.
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
            up="have more than doubled to"
            down="have fallen to"
            steady="are steady at"
          />{" "}
          <Forecast v="chikEea2026" suffix=" cases" change /> after{" "}
          <Term tip="Nearly all locally acquired cases in Europe this year have been in France, with one in Italy.">
            France
          </Term>{" "}
          went from 57 to{" "}
          <DataPoint s={SRC.spfChikFrance}>162 local cases</DataPoint>.
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
            up="has risen to"
            down="has fallen to"
            steady="is steady at"
          />{" "}
          <Forecast v="screwwormUs2027" suffix=" animal cases" change />, as
          detections continue near the border and USDA confirmed the first US
          wildlife case, an elk in Texas.
        </>
      ),
    },
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
            down="has eased to"
            steady="is steady at"
          />{" "}
          <Forecast v="measlesUs2027" change />, even as 2026 cases climbed past{" "}
          <DataPoint s={SRC.cdcMeaslesUs2026}>4,400</DataPoint>. The forecast
          for Europe{" "}
          <Trend
            v="measlesEea2027"
            up="rose to"
            down="fell to"
            steady="held at"
          />{" "}
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
            steady="holds at"
          />{" "}
          <Forecast v="ebolaUsCaseBeforeJul2027" />, even as the outbreak
          reached Kenya and Nigeria.
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
            <Forecast v="respPeakCovid" /> for COVID-19 (up from 1.7 in
            September), and <Forecast v="respPeakRsvInfants" /> for RSV in
            children under 5 (up from 19.9), with a combined peak of{" "}
            <Forecast v="respPeakCombined" /> around{" "}
            <Forecast v="respPeakWeek" interval />.
          </p>
          <p>
            The big change is the strain. In September, forecasters expected an
            H3N2-dominant season, with H1N1 at 35.1% of influenza A. They now
            put H1N1 at <Forecast v="fluH1n1Share" interval />. Flu arrived
            early, and almost all of it is H1N1: in the week ending October 10,{" "}
            <DataPoint s={SRC.cdcFluPositivity}>5.0%</DataPoint> of clinical lab
            specimens tested positive for influenza, which CDC says is higher
            than usual for this time of year, and{" "}
            <DataPoint s={SRC.cdcFluH1n1}>96.4%</DataPoint> of subtyped
            influenza A was H1N1. The forecast for the CDC season severity
            rating is <Forecast v="fluSeverityModerate" /> Moderate,{" "}
            <Forecast v="fluSeverityHigh" /> High (up from 19.0%),{" "}
            <Forecast v="fluSeverityLow" /> Low or lower (down from 12.1%), and{" "}
            <Forecast v="fluSeverityVeryHigh" /> Very High or higher.
          </p>
        </>
      ),
      proSummary: (
        <p>
          By late September, flu test positivity was about double the same weeks
          in the past 4 years, and early subtyping came back over 95% H1N1,
          matching early seasons in South Korea and Japan. Pros think last
          season’s <Term tip={SUBCLADE_K_TIP}>subclade K</Term> wave left fewer
          people susceptible to H3N2. Since H1N1 tends to cause fewer
          hospitalizations, most read the early start as a timing shift more
          than a severe season. They also sit below the crowd on RSV in young
          children, since infant antibody shots seem to be working.
        </p>
      ),
      sources: [SRC.cdcFluPositivity, SRC.cdcFluH1n1],
    },
    measles: {
      body: (
        <>
          <p>
            For 2027, forecasters expect{" "}
            <Forecast v="measlesUs2027" change interval /> measles cases in the
            US and <Forecast v="measlesEea2027" change interval /> in Europe.
          </p>
          <p>
            US cases keep climbing, now at{" "}
            <DataPoint s={SRC.cdcMeaslesUs2026}>4,410 confirmed</DataPoint> in
            2026, up from 3,294 in September, with a large outbreak in
            Pennsylvania and 3 deaths. Forecasters expect{" "}
            <Forecast v="measlesUs2026" interval /> US cases by the end of 2026,
            with about <Forecast v="measlesUsHospitalization2026" /> of them
            hospitalized. Europe stays quiet:{" "}
            <DataPoint s={SRC.ecdcMeaslesAugust}>143 cases</DataPoint> in
            August, and <DataPoint s={SRC.ecdcMeasles12Months}>2,335</DataPoint>{" "}
            over the 12 months through August. Forecasters put the chance that
            the US loses its measles elimination status before 2027 at{" "}
            <Forecast v="measlesUsElimination" />.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros see no sign of US cases slowing, so 2027 increasingly looks like
          2026 rather than the years before it. For Europe, they’ve nudged down
          because the rolling 12-month count is still under 2,500, and ECDC
          hasn’t published anything newer than August.
        </p>
      ),
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
            keeps growing and is now the second-largest Ebola outbreak on
            record. As of October 15, there are{" "}
            <DataPoint s={SRC.cdcEbolaCases}>9,235 confirmed</DataPoint> cases
            and{" "}
            <DataPoint s={SRC.cdcEbolaDeaths}>4,444 confirmed deaths</DataPoint>
            , up from 7,200 and 3,475 in early September. It has also spread
            beyond the region: Kenya has 9 confirmed cases, all in one family
            cluster, and Nigeria confirmed its first case on October 20, in a
            woman who had traveled from Uganda.
          </p>
          <p>
            Forecasters{" "}
            <Trend
              v="ebolaUsCaseBeforeJul2027"
              up="have raised"
              down="have lowered"
              steady="have held"
            />{" "}
            the chance of a{" "}
            <Forecast v="ebolaUsCaseBeforeJul2027">first US case</Forecast>{" "}
            before July 2027{" "}
            <Trend v="ebolaUsCaseBeforeJul2027" up="to" down="to" steady="at" />{" "}
            <Forecast v="ebolaUsCaseBeforeJul2027" />. They expect{" "}
            <Forecast v="ebolaCasesOutbreakEnd" /> confirmed cases by the time
            the outbreak ends.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros keep the chance of a US case low, pointing to the 21-day travel
          restriction and a base rate of 1 US diagnosis in 18 Ebola outbreaks
          since 2010, during the much larger 2014–16 West Africa epidemic.
          Before Nigeria’s case, one pro saw early signs that the DRC epidemic
          was slowly coming under control, but the cases in Kenya and Nigeria
          show it can still travel.
        </p>
      ),
      sources: [SRC.cdcEbolaCases, SRC.cdcEbolaDeaths],
    },
    screwworm: {
      body: (
        <>
          <p>
            US detections remain low but haven’t stopped, with{" "}
            <DataPoint s={SRC.usdaScrewworm2026}>56 confirmed</DataPoint> animal
            cases in 2026, up from 49 in September, including new cases in New
            Mexico. On October 21, USDA confirmed the first US wildlife case, an
            elk on a game ranch in Pecos County, Texas. Forecasters now expect{" "}
            <Forecast
              v="screwwormUs2027"
              suffix=" animal cases"
              change
              interval
            />{" "}
            in 2027.
          </p>
          <p>
            Detections within 100 miles of the border in{" "}
            <Term tip="Since 2023 the screwworm fly has moved north through Central America and into Mexico.">
              Mexico
            </Term>{" "}
            continue, with 10 animals reported between October 16 and 20 alone,
            which keeps the risk of new spillover alive into next year.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros are more optimistic than the community, at 43–52 cases. They read
          the slower pace since July as a sign that surveillance, sterile fly
          releases, and treatment are working, though not fully stopping spread:
          the New Mexico cases and the first fly trap detection in September
          hint at undetected cases in wild animals. They don’t expect much new
          information until around May, and keep a long upper tail for failed
          containment or a wet <Term tip={EL_NINO_TIP}>El Niño</Term> winter.
        </p>
      ),
      sources: [SRC.usdaScrewworm2026],
    },
    chikungunya: {
      body: (
        <p>
          France kept adding cases into October, reaching{" "}
          <DataPoint s={SRC.spfChikFrance}>
            162 locally acquired cases
          </DataPoint>{" "}
          across 22 clusters as of October 12, up from 57 in September, plus 1
          case in Italy. Forecasters more than doubled their forecast, to{" "}
          <Forecast v="chikEea2026" suffix=" locally acquired cases" interval />{" "}
          in 2026, up from 98.
        </p>
      ),
      proSummary: (
        <p>
          A late-September surge (+34 and +35 cases in a single week, the
          biggest jumps of the season) caught pros out, and they moved their
          medians from about 100–140 up to about 200. A warm autumn has kept
          mosquitoes active longer than usual and new clusters keep appearing.
          Most now model about 1 new case a day into November or early December,
          then a sharp stop once temperatures drop, with a heavy upper tail.
        </p>
      ),
      sources: [SRC.spfChikFrance],
    },
  },
};
