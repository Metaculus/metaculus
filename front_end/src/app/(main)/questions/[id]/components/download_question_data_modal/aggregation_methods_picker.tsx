"use client";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { FormError } from "@/components/ui/form_field";
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

  const toggle = (method: DownloadAggregationMethod) => {
    if (disabled) return;
    if (methods.includes(method)) {
      const next = methods.filter((m) => m !== method);
      if (next.length > 0) onChange(next);
    } else {
      onChange([...methods, method]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = methods.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => toggle(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? "border-blue-600 bg-blue-600 text-gray-0 dark:border-blue-600-dark dark:bg-blue-600-dark dark:text-gray-0-dark"
                  : "border-gray-400 bg-gray-0 text-gray-700 hover:border-blue-500 hover:text-gray-900 dark:border-gray-400-dark dark:bg-gray-0-dark dark:text-gray-700-dark dark:hover:border-blue-500-dark dark:hover:text-gray-900-dark",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {isSelected && (
                <FontAwesomeIcon icon={faXmark} className="size-2.5" />
              )}
              {option.label}
            </button>
          );
        })}
      </div>
      {errors && <FormError errors={errors} />}
    </div>
  );
};

const useAggregationMethodOptions = () => {
  const { user } = useAuth();
  const t = useTranslations();

  return useMemo(() => {
    const options = [
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
  }, [user?.is_staff, t]);
};

export default AggregationMethodsPicker;
