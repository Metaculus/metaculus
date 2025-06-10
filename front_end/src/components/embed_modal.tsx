"use client";

import { Field, Label, Select } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import BaseModal from "@/components/base_modal";
import {
  ENFORCED_THEME_PARAM,
  GRAPH_ZOOM_PARAM,
  EMBED_QUESTION_TITLE,
  CHART_TYPE_PARAM,
} from "@/constants/global_search_params";
import useAppTheme from "@/hooks/use_app_theme";
import { EmbedChartType, TimelineChartZoomOption } from "@/types/charts";
import { QuestionType } from "@/types/question";
import { AppTheme } from "@/types/theme";
import { getChartZoomOptions } from "@/utils/charts/helpers";
import { addUrlParams } from "@/utils/navigation";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  url: string;
  embedHeight: number;
  embedWidth: number;
  withChartZoom?: boolean;
  postTitle?: string;
  questionType?: QuestionType;
};

const EmbedModal: FC<Props> = ({
  isOpen,
  onClose,
  url,
  embedWidth,
  embedHeight,
  withChartZoom,
  postTitle,
  questionType,
}) => {
  const t = useTranslations();
  const { theme: appTheme } = useAppTheme();

  const [embedTheme, setEmbedTheme] = useState<AppTheme>(appTheme);
  const [embedTitle, setEmbedTitle] = useState(postTitle);
  const zoomOptions = getChartZoomOptions();
  const [chartZoom, setChartZoom] = useState(TimelineChartZoomOption.All);
  const [chartType, setChartType] = useState<EmbedChartType>(
    EmbedChartType.Timeline
  );
  const iFrameSrc = useMemo(
    () =>
      addUrlParams(url, [
        { paramName: ENFORCED_THEME_PARAM, paramValue: embedTheme },
        ...(embedTitle
          ? [{ paramName: EMBED_QUESTION_TITLE, paramValue: embedTitle }]
          : []),
        ...(withChartZoom
          ? [{ paramName: GRAPH_ZOOM_PARAM, paramValue: chartZoom }]
          : []),
        ...(chartType === EmbedChartType.Current
          ? [{ paramName: CHART_TYPE_PARAM, paramValue: chartType }]
          : []),
      ]),
    [chartZoom, embedTheme, embedTitle, url, withChartZoom, chartType]
  );
  const isContinuousQuestion =
    questionType === QuestionType.Date || questionType === QuestionType.Numeric;

  return (
    <BaseModal label={t("embedThisPage")} isOpen={isOpen} onClose={onClose}>
      <div className="max-w-2xl">
        <p className="text-base leading-tight">{t("embedCodeSnippet")}</p>
        <div>
          <div className="flex flex-wrap gap-4">
            <Field className="flex flex-wrap items-center gap-2 text-base leading-tight">
              <Label>{t("selectATheme")}</Label>
              <Select
                value={embedTheme}
                onChange={(event) =>
                  setEmbedTheme(event.target.value as AppTheme)
                }
                name="chart-theme"
                className="select-arrow h-8 rounded border border-gray-700 bg-inherit bg-[length:22px_20%] bg-no-repeat px-3 text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
              >
                <option className="capitalize" value="light">
                  {t("light")}
                </option>
                <option className="capitalize" value="dark">
                  {t("dark")}
                </option>
              </Select>
            </Field>
            {withChartZoom && (
              <Field className="flex flex-wrap items-center gap-2 text-base leading-tight">
                <Label>{t("selectAGraphZoom")}</Label>
                <Select
                  value={chartZoom}
                  onChange={(event) =>
                    setChartZoom(event.target.value as TimelineChartZoomOption)
                  }
                  name="chart-theme"
                  className="select-arrow h-8 rounded border border-gray-700 bg-inherit bg-[length:22px_20%] bg-no-repeat px-3 text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
                >
                  {zoomOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.label)}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {isContinuousQuestion && (
              <Field className="flex flex-wrap items-center gap-2 text-base leading-tight">
                <Label>{t("selectAGraphType")}</Label>
                <Select
                  value={chartType}
                  onChange={(event) =>
                    setChartType(event.target.value as EmbedChartType)
                  }
                  name="chart-theme"
                  className="select-arrow h-8 rounded border border-gray-700 bg-inherit bg-[length:22px_20%] bg-no-repeat px-3 text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
                >
                  <option value={EmbedChartType.Timeline}>
                    {t("forecastTimelineHeading")}
                  </option>
                  <option value={EmbedChartType.Current}>
                    {t("currentForecast")}
                  </option>
                </Select>
              </Field>
            )}
          </div>
          <div className="mt-4">
            <label>
              Embeded question title
              <input
                onChange={(e) => setEmbedTitle(e.target.value)}
                value={embedTitle}
                className="h-10 w-full rounded border border-gray-700 bg-inherit px-3 py-2 font-mono text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
              ></input>
            </label>
          </div>

          <textarea
            autoFocus
            className="mt-4 h-36 w-full rounded border border-gray-700 bg-inherit px-3 py-2 font-mono text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
            onFocus={(event) => event.target.select()}
            readOnly
            value={`<iframe src="${iFrameSrc}" style="height:${embedHeight}px; width:100%; max-width:${embedWidth}px"></iframe>`}
          />
          <span className="my-2 text-base leading-tight">{t("preview")}</span>
          <div className="mt-2 max-w-full overflow-x-auto">
            <iframe
              className="mx-auto"
              src={iFrameSrc}
              style={{
                height: embedHeight,
                width: "100%",
                maxWidth: embedWidth,
              }}
            />
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default EmbedModal;
