"use client";

import { faX, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

import { useAuth } from "@/contexts/auth_context";
import {
  AggregationMethod,
  aggregationMethodsArray,
  aggregationMethodLabel,
} from "@/types/question";

const AggregationMethodsPicker: React.FC<{
  methods: AggregationMethod[];
  onChange: (method: AggregationMethod[]) => void;
}> = ({ methods, onChange }) => {
  const { user } = useAuth();
  const t = useTranslations();

  return (
    <div>
      <Combobox
        immediate
        multiple
        value={methods}
        onChange={(newMethods) => {
          onChange(newMethods);
        }}
      >
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded border border-gray-500 bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <ComboboxInput
              className="w-full cursor-pointer border-none p-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 dark:bg-blue-950 dark:text-gray-200"
              readOnly
              displayValue={() => t("chooseAggregationsToInclude")}
            />
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-blue-950 sm:text-sm">
              {aggregationMethodsArray.map((method, index) => {
                if (
                  method === AggregationMethod.single_aggregation &&
                  !user?.is_staff
                ) {
                  return null;
                }
                return (
                  <ComboboxOption
                    key={index}
                    className={({ active }) =>
                      `group relative cursor-default select-none ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-gray-900 dark:text-gray-300"
                      }`
                    }
                    value={method}
                  >
                    {({ selected }) => (
                      <div className="flex flex-row items-center">
                        <span
                          className={`block cursor-pointer truncate py-2 pl-4 pr-2.5 ${
                            selected ? "font-bold" : "font-normal"
                          }`}
                        >
                          {aggregationMethodLabel[method]}
                        </span>
                        {selected && (
                          <span className="flex items-center">
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="text-blue-600 group-hover:text-white group-focus:text-white"
                            />
                          </span>
                        )}
                      </div>
                    )}
                  </ComboboxOption>
                );
              })}
            </ComboboxOptions>
          </Transition>
        </div>
      </Combobox>
      <div className="mt-2 flex flex-wrap items-start gap-2">
        {methods.map((method: AggregationMethod, cat_index: number) => {
          return (
            <div
              className="group flex w-auto cursor-pointer flex-row items-center rounded bg-blue-200 p-2 text-sm dark:bg-blue-700"
              key={cat_index}
              onClick={() => {
                onChange([
                  ...methods.slice(0, cat_index),
                  ...methods.slice(cat_index + 1),
                ]);
              }}
            >
              <FontAwesomeIcon
                className="mr-2 cursor-pointer text-gray-400 group-hover:text-gray-500 dark:text-blue-500 dark:group-hover:text-gray-200"
                icon={faX}
              ></FontAwesomeIcon>
              <span>{aggregationMethodLabel[method]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AggregationMethodsPicker;
