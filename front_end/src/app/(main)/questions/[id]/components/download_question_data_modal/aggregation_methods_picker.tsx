"use client";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";
import * as React from "react";

import { FormError } from "@/components/ui/form_field";
import Listbox, { SelectOption } from "@/components/ui/listbox";
import { useAuth } from "@/contexts/auth_context";
import { ErrorResponse } from "@/types/fetch";
import { DownloadAggregationMethod } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  methods: DownloadAggregationMethod[];
  onChange: (methods: DownloadAggregationMethod[]) => void;
  disabled?: boolean;
  errors?: ErrorResponse;
};

const AggregationMethodsPicker: FC<Props> = ({
  methods,
  onChange,
  disabled = false,
  errors,
}) => {
  const options = useAggregationMethodOptions();

  const optionsLabelMap = useMemo(
    () =>
      options.reduce<Record<DownloadAggregationMethod, string>>(
        (acc, el) => ({ ...acc, [el.value]: el.label }),
        {} as Record<DownloadAggregationMethod, string>
      ),
    [options]
  );

  return (
    <div>
      <Listbox
        value={methods}
        onChange={onChange}
        options={options}
        multiple
        menuPosition="left"
        buttonVariant="tertiary"
        disabled={disabled}
      />
      {!!methods.length && (
        <div className="mt-2 flex flex-wrap items-start gap-2">
          {methods.map((method) => (
            <div
              className={cn(
                "group flex w-auto flex-row items-center rounded bg-blue-200 p-2 text-sm dark:bg-blue-700",
                { "cursor-pointer": !disabled }
              )}
              key={`selected-method-${method}`}
              onClick={() => {
                if (disabled) return;

                onChange(methods.filter((el) => el !== method));
              }}
            >
              {!disabled && (
                <FontAwesomeIcon
                  className="mr-2 cursor-pointer text-gray-400 group-hover:text-gray-500 dark:text-blue-500 dark:group-hover:text-gray-200"
                  icon={faX}
                />
              )}
              <span>{optionsLabelMap[method]}</span>
            </div>
          ))}
        </div>
      )}
      {errors && <FormError errors={errors} />}
    </div>
  );
};

const useAggregationMethodOptions =
  (): SelectOption<DownloadAggregationMethod>[] => {
    const { user } = useAuth();
    const t = useTranslations();

    const options: SelectOption<DownloadAggregationMethod>[] = [
      {
        value: DownloadAggregationMethod.recency_weighted,
        label: t("recencyWeighted"),
      },
      {
        value: DownloadAggregationMethod.unweighted,
        label: t("unweighted"),
      },
      {
        value: DownloadAggregationMethod.geometric_mean,
        label: t("geometricMean"),
      },
    ];

    if (user?.is_staff) {
      options.push({
        value: DownloadAggregationMethod.single_aggregation,
        label: t("singleAggregation"),
      });
      options.push({
        value: DownloadAggregationMethod.metaculus_prediction,
        label: t("metaculusPredictionLabel"),
      });
    }

    return options;
  };

export default AggregationMethodsPicker;
