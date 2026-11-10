import type { Messages } from "next-intl";

import { WorldArea } from "./questions";

type MessageKey = keyof Messages;

export type Rgb = [number, number, number];

export const AREA_PALETTES: Record<WorldArea, [Rgb, Rgb, Rgb]> = {
  sci: [
    [82, 207, 160],
    [120, 235, 215],
    [70, 190, 230],
  ],
  prog: [
    [90, 110, 255],
    [140, 100, 240],
    [70, 170, 250],
  ],
  work: [
    [250, 115, 135],
    [240, 110, 200],
    [250, 185, 120],
  ],
  robo: [
    [110, 215, 240],
    [170, 235, 225],
    [140, 190, 255],
  ],
  media: [
    [170, 100, 255],
    [120, 130, 255],
    [230, 130, 230],
  ],
};

export const AREA_ORDER: WorldArea[] = ["sci", "prog", "work", "robo", "media"];

export type QuestionCopy = {
  titleKey: MessageKey;
  laneKey: MessageKey;
  nowKey: MessageKey;
  // Used instead of nowKey while the adoption this capability unlocks lags.
  gapKey?: MessageKey;
};

export type AreaSectionCopy = {
  introKey: MessageKey;
  questions: Record<string, QuestionCopy>;
};

export const AREA_SECTIONS: Partial<Record<WorldArea, AreaSectionCopy>> = {
  sci: {
    introKey: "worldByYearAreaIntroSciences",
    questions: {
      he1: {
        titleKey: "worldByYearQuestionHe1",
        laneKey: "worldByYearLaneHe1",
        nowKey: "worldByYearNowHe1",
        gapKey: "worldByYearGapHe1",
      },
      he2: {
        titleKey: "worldByYearQuestionHe2",
        laneKey: "worldByYearLaneHe2",
        nowKey: "worldByYearNowHe2",
      },
      he5: {
        titleKey: "worldByYearQuestionHe5",
        laneKey: "worldByYearLaneHe5",
        nowKey: "worldByYearNowHe5",
        gapKey: "worldByYearGapHe5",
      },
      he3: {
        titleKey: "worldByYearQuestionHe3",
        laneKey: "worldByYearLaneHe3",
        nowKey: "worldByYearNowHe3",
      },
      he6: {
        titleKey: "worldByYearQuestionHe6",
        laneKey: "worldByYearLaneHe6",
        nowKey: "worldByYearNowHe6",
      },
      he4: {
        titleKey: "worldByYearQuestionHe4",
        laneKey: "worldByYearLaneHe4",
        nowKey: "worldByYearNowHe4",
      },
      he7: {
        titleKey: "worldByYearQuestionHe7",
        laneKey: "worldByYearLaneHe7",
        nowKey: "worldByYearNowHe7",
      },
      l6: {
        titleKey: "worldByYearQuestionL6",
        laneKey: "worldByYearLaneL6",
        nowKey: "worldByYearNowL6",
      },
      mq10411: {
        titleKey: "worldByYearQuestionMq10411",
        laneKey: "worldByYearLaneMq10411",
        nowKey: "worldByYearNowMq10411",
      },
    },
  },
  prog: {
    introKey: "worldByYearAreaIntroProgramming",
    questions: {
      w5: {
        titleKey: "worldByYearQuestionW5",
        laneKey: "worldByYearLaneW5",
        nowKey: "worldByYearNowW5",
        gapKey: "worldByYearGapW5",
      },
      w6: {
        titleKey: "worldByYearQuestionW6",
        laneKey: "worldByYearLaneW6",
        nowKey: "worldByYearNowW6",
      },
      p3: {
        titleKey: "worldByYearQuestionP3",
        laneKey: "worldByYearLaneP3",
        nowKey: "worldByYearNowP3",
      },
      p1: {
        titleKey: "worldByYearQuestionP1",
        laneKey: "worldByYearLaneP1",
        nowKey: "worldByYearNowP1",
        gapKey: "worldByYearGapP1",
      },
      p2: {
        titleKey: "worldByYearQuestionP2",
        laneKey: "worldByYearLaneP2",
        nowKey: "worldByYearNowP2",
      },
      mq38391: {
        titleKey: "worldByYearQuestionMq38391",
        laneKey: "worldByYearLaneMq38391",
        nowKey: "worldByYearNowMq38391",
      },
      mq406: {
        titleKey: "worldByYearQuestionMq406",
        laneKey: "worldByYearLaneMq406",
        nowKey: "worldByYearNowMq406",
      },
    },
  },
  work: {
    introKey: "worldByYearAreaIntroWork",
    questions: {
      w1: {
        titleKey: "worldByYearQuestionW1",
        laneKey: "worldByYearLaneW1",
        nowKey: "worldByYearNowW1",
        gapKey: "worldByYearGapW1",
      },
      w2: {
        titleKey: "worldByYearQuestionW2",
        laneKey: "worldByYearLaneW2",
        nowKey: "worldByYearNowW2",
      },
      w7: {
        titleKey: "worldByYearQuestionW7",
        laneKey: "worldByYearLaneW7",
        nowKey: "worldByYearNowW7",
      },
      w3: {
        titleKey: "worldByYearQuestionW3",
        laneKey: "worldByYearLaneW3",
        nowKey: "worldByYearNowW3",
      },
      w4: {
        titleKey: "worldByYearQuestionW4",
        laneKey: "worldByYearLaneW4",
        nowKey: "worldByYearNowW4",
      },
      l3: {
        titleKey: "worldByYearQuestionL3",
        laneKey: "worldByYearLaneL3",
        nowKey: "worldByYearNowL3",
        gapKey: "worldByYearGapL3",
      },
      l4: {
        titleKey: "worldByYearQuestionL4",
        laneKey: "worldByYearLaneL4",
        nowKey: "worldByYearNowL4",
      },
      l5: {
        titleKey: "worldByYearQuestionL5",
        laneKey: "worldByYearLaneL5",
        nowKey: "worldByYearNowL5",
      },
      c1: {
        titleKey: "worldByYearQuestionC1",
        laneKey: "worldByYearLaneC1",
        nowKey: "worldByYearNowC1",
        gapKey: "worldByYearGapC1",
      },
      c2: {
        titleKey: "worldByYearQuestionC2",
        laneKey: "worldByYearLaneC2",
        nowKey: "worldByYearNowC2",
      },
      mq19356: {
        titleKey: "worldByYearQuestionMq19356",
        laneKey: "worldByYearLaneMq19356",
        nowKey: "worldByYearNowMq19356",
      },
    },
  },
  robo: {
    introKey: "worldByYearAreaIntroRobotics",
    questions: {
      mq16625: {
        titleKey: "worldByYearQuestionMq16625",
        laneKey: "worldByYearLaneMq16625",
        nowKey: "worldByYearNowMq16625",
        gapKey: "worldByYearGapMq16625",
      },
      h4: {
        titleKey: "worldByYearQuestionH4",
        laneKey: "worldByYearLaneH4",
        nowKey: "worldByYearNowH4",
      },
      h5: {
        titleKey: "worldByYearQuestionH5",
        laneKey: "worldByYearLaneH5",
        nowKey: "worldByYearNowH5",
      },
      m1: {
        titleKey: "worldByYearQuestionM1",
        laneKey: "worldByYearLaneM1",
        nowKey: "worldByYearNowM1",
        gapKey: "worldByYearGapM1",
      },
      m2: {
        titleKey: "worldByYearQuestionM2",
        laneKey: "worldByYearLaneM2",
        nowKey: "worldByYearNowM2",
      },
      m3: {
        titleKey: "worldByYearQuestionM3",
        laneKey: "worldByYearLaneM3",
        nowKey: "worldByYearNowM3",
      },
      m4: {
        titleKey: "worldByYearQuestionM4",
        laneKey: "worldByYearLaneM4",
        nowKey: "worldByYearNowM4",
      },
      m5: {
        titleKey: "worldByYearQuestionM5",
        laneKey: "worldByYearLaneM5",
        nowKey: "worldByYearNowM5",
      },
      m6: {
        titleKey: "worldByYearQuestionM6",
        laneKey: "worldByYearLaneM6",
        nowKey: "worldByYearNowM6",
      },
      mq43262: {
        titleKey: "worldByYearQuestionMq43262",
        laneKey: "worldByYearLaneMq43262",
        nowKey: "worldByYearNowMq43262",
      },
      mq43263: {
        titleKey: "worldByYearQuestionMq43263",
        laneKey: "worldByYearLaneMq43263",
        nowKey: "worldByYearNowMq43263",
      },
    },
  },
};
