import { defineProComments, defineSources, Edition } from "./types";
import { DataPoint, Forecast, Term } from "../components/tokens";

const SRC = defineSources({
  cdcEbolaCases: {
    source: "cdcEbola",
    label: "Confirmed Bundibugyo Ebola cases in the DRC outbreak",
    value: "5,794",
    asOf: "2026-08-26",
  },
  cdcEbolaDeaths: {
    source: "cdcEbola",
    label: "Confirmed Bundibugyo Ebola deaths in the DRC outbreak",
    value: "2,786",
    asOf: "2026-08-26",
  },
  usdaScrewworm2026: {
    source: "usdaScrewworm",
    label: "Confirmed US New World screwworm animal cases in 2026",
    value: "46",
    asOf: "2026-08-28",
  },
  spfChikFrance: {
    source: "spfChikungunya",
    label: "Locally acquired chikungunya cases in mainland France in 2026",
    value: "15",
    asOf: "2026-08-12",
    url: "https://www.santepubliquefrance.fr/en/vector-borne-diseases/chikungunya/national-bulletin/chikungunya-dengue-zika-and-west-nile-virus-mainland-france-enhanced-surveillance-bulletin-august-12",
  },
});

const PRO = defineProComments({
  ebola: {
    postId: 45008,
    commentId: 1035674,
    author: "dimaklenchin",
    date: "2026-08-13",
    excerpt:
      "There were no importations to the USA during the soccer World Cup, and the numbers outside DRC remain stable. That calls for a very low number. Still, the outbreak is spreading both geographically and in absolute number of cases with no sign of slowing down (it could well end up being the largest Ebola outbreak ever), so there is always a possibility that one or a few reach the US.",
  },
});

export const EDITION_2026_08: Edition = {
  slug: "2026-08",
  asOf: "2026-08-28T12:00:00Z",
  takeaways: [
    {
      id: "ebola",
      diseases: ["ebola"],
      lead: "ebolaUsCaseBeforeJul2027",
      content: (
        <>
          Bundibugyo Ebola keeps growing in eastern DRC with no spread outside
          the region yet. Forecasters hold the chance of a case in the US before
          July 2027 at <Forecast v="ebolaUsCaseBeforeJul2027" />.
        </>
      ),
    },
    {
      id: "screwworm",
      diseases: ["screwworm"],
      lead: "screwwormUs2027",
      content: (
        <>
          US screwworm activity has slowed since the early-summer surge, with
          only <Forecast v="screwwormUs2027" suffix=" confirmed animal cases" />{" "}
          expected in 2027.
        </>
      ),
    },
    {
      id: "measles",
      diseases: ["measles"],
      lead: "measlesUs2027",
      content: (
        <>
          Measles cases are expected to remain relatively high on both sides of
          the Atlantic in 2027, with{" "}
          <Forecast v="measlesUs2027" suffix=" US cases" /> and{" "}
          <Forecast v="measlesEea2027" /> in Europe. This is well above the
          pre-2025 norm but short of the 2024 European surge.
        </>
      ),
    },
    {
      id: "respiratory",
      diseases: ["respiratory"],
      lead: "respPeakInfluenza",
      content: (
        <>
          At this early stage, the 2026/27 respiratory season is expected to
          look much like last year’s, with peak weekly hospital admissions per
          100,000 of <Forecast v="respPeakInfluenza" /> for influenza,{" "}
          <Forecast v="respPeakCovid" /> for COVID-19,{" "}
          <Forecast v="respPeakRsvInfants" /> for RSV in children under 5, and a
          combined peak of <Forecast v="respPeakCombined" /> around{" "}
          <Forecast v="respPeakWeek" />.
        </>
      ),
    },
  ],
  sections: {
    ebola: {
      body: (
        <>
          <p>
            The outbreak in eastern DRC is still growing in both case count and
            geographic reach, with no clear sign of slowing. It’s on track to
            become the largest Ebola outbreak on record, with{" "}
            <DataPoint s={SRC.cdcEbolaCases}>5,794 confirmed cases</DataPoint>{" "}
            and{" "}
            <DataPoint s={SRC.cdcEbolaDeaths}>2,786 confirmed deaths</DataPoint>{" "}
            as of August 26. There have been no cases confirmed outside of DRC
            and Uganda.
          </p>
          <p>
            Forecasters continue to put the chance of a first US case before
            July 2027 at <Forecast v="ebolaUsCaseBeforeJul2027" />. The World
            Cup passed without an importation, which was the largest near-term
            risk factor in earlier updates.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Pros see the 21-day travel restriction for anyone who has been in the
          DRC as the main barrier, and exposed American aid workers have gone to
          Germany rather than the US for treatment. The historical base rate is
          close to zero: the 2014 US cases involved a different strain.
        </p>
      ),
      quote: PRO.ebola,
      sources: [SRC.cdcEbolaCases, SRC.cdcEbolaDeaths],
    },
    screwworm: {
      body: (
        <p>
          Detections rose sharply through early summer, then dropped off, with{" "}
          <DataPoint s={SRC.usdaScrewworm2026}>46 total confirmed</DataPoint>{" "}
          cases in 2026 but only 2 in August so far. Forecasters expect{" "}
          <Forecast v="screwwormUs2027" suffix=" animal cases" interval /> in
          2027, probably somewhat worse than 2026 but nowhere near Mexico’s
          path, where the first reemergent case in November 2024 was followed by
          more than 5,000 cases by August 2025.
        </p>
      ),
      proSummary: (
        <p>
          The more conservative Pros point to colder winters, early detection in
          agricultural herds and emergency authorization of antiparasitics. The
          higher forecasts come from the strong El Niño expected next year,
          which would favor overwintering in south Texas, while the new sterile
          fly facility in Texas won’t be operational until late 2027.
        </p>
      ),
      sources: [SRC.usdaScrewworm2026],
    },
    measles: {
      body: (
        <p>
          Forecasters expect <Forecast v="measlesUs2027" interval /> confirmed
          US measles cases in 2027 and <Forecast v="measlesEea2027" interval />{" "}
          in Europe. Both distributions have long right tails, since the total
          depends on how many outbreaks go uncontrolled and how far each one
          travels.
        </p>
      ),
      proSummary: (
        <p>
          Pros see the US as having shifted to a structurally higher measles
          rate that won’t return to the pre-2025 norm, though a dramatic
          increase from 2026 looks unlikely. For Europe, the projection is low
          by historical standards, far below the 2024 total of 35,212 that came
          mostly from Romania.
        </p>
      ),
    },
    respiratory: {
      body: (
        <>
          <p>
            Forecasters put H1N1 at <Forecast v="fluH1n1Share" interval /> of
            influenza A this season, which points to an{" "}
            <Term tip="An influenza A subtype. H3N2-dominant seasons have historically leaned more severe.">
              H3N2
            </Term>
            -dominant year. The forecast for the CDC’s in-season severity
            assessment stays near base rates, at{" "}
            <Forecast v="fluSeverityModerate" /> Moderate,{" "}
            <Forecast v="fluSeverityHigh" /> High,{" "}
            <Forecast v="fluSeverityLow" /> Low or lower, and{" "}
            <Forecast v="fluSeverityVeryHigh" /> Very High or higher.
          </p>
          <p>
            RSV hospitalizations in adults 75 and over are forecast to peak at{" "}
            <Forecast v="respPeakRsvElderly" /> per 100,000. On immunization,
            infants under 8 months are expected to reach{" "}
            <Forecast v="rsvImmunizationInfants" /> coverage by February 2027,
            and adults 75+ <Forecast v="rsvImmunizationAdults75" />.
          </p>
        </>
      ),
      proSummary: (
        <p>
          Several Pros read recent flu peaks as strains persisting across
          consecutive seasons rather than a straight climb, so the influenza
          forecast sits near the mean of the past four seasons. They credit
          monoclonal antibody uptake for part of the lower RSV forecast in young
          children.
        </p>
      ),
    },
    chikungunya: {
      body: (
        <p>
          As of August 12, there were{" "}
          <DataPoint s={SRC.spfChikFrance}>15 cases</DataPoint> in Europe, all
          in France, across 3 clusters. Forecasters expect{" "}
          <Forecast v="chikEea2026" suffix=" locally acquired cases" interval />{" "}
          in 2026, a more typical year than 2025.
        </p>
      ),
      proSummary: (
        <p>
          Roughly 75% of locally acquired cases historically fall in August and
          September. Pros see an outbreak starting in Italy or Spain as the main
          risk, while insecticide spraying may contain the existing French
          clusters.
        </p>
      ),
      sources: [SRC.spfChikFrance],
    },
    h5: {
      body: (
        <p>
          Forecasters give a <Forecast v="h5Pheic" /> chance that the WHO
          declares an H5 virus a Public Health Emergency of International
          Concern before 2028. The US has recorded 71 human H5 cases since 2024,
          with none since November 2025 and none with evidence of human-to-human
          transmission.
        </p>
      ),
      proSummary: (
        <p>
          Without human-to-human transmission or much larger bird-to-human
          spillover, Pros see an emergency declaration as very unlikely, but
          continued circulation in wild birds, poultry and cattle keeps the
          mutation risk above zero.
        </p>
      ),
    },
  },
  frozen: {
    ebolaUsCaseBeforeJul2027: { value: 0.1 },
    screwwormUs2027: { value: 46, lower: 20, upper: 87 },
    measlesUs2027: { value: 3501, lower: 2293, upper: 5361 },
    measlesEea2027: { value: 3435, lower: 2095, upper: 5958 },
    respPeakInfluenza: { value: 11.4 },
    respPeakCovid: { value: 1.71 },
    respPeakRsvInfants: { value: 20.2 },
    respPeakRsvElderly: { value: 10.3 },
    respPeakCombined: { value: 15.8 },
    respPeakWeek: {
      value: 1798675200,
      lower: 1797724800,
      upper: 1800057600,
    },
    fluH1n1Share: { value: 32, lower: 14, upper: 62 },
    fluSeverityTop: { value: 0.67, option: "Moderate" },
    fluSeverityModerate: { value: 0.67 },
    fluSeverityHigh: { value: 0.19 },
    fluSeverityLow: { value: 0.12 },
    fluSeverityVeryHigh: { value: 0.02 },
    rsvImmunizationInfants: { value: 72.2 },
    rsvImmunizationAdults75: { value: 46.6 },
    chikEea2026: { value: 81, lower: 54, upper: 121 },
    h5Pheic: { value: 0.06 },
  },
};
