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
};
