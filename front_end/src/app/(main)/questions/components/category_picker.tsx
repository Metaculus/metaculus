"use client";

import { faSearch, faX, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";

import { Category } from "@/types/post";

const CategoryPicker: React.FC<{
  allCategories: Category[];
  categories: Category[];
  onChange: (categories: Category[]) => void;
}> = ({ allCategories, categories, onChange }) => {
  const [query, setQuery] = useState<string>("");
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  useEffect(() => {
    setFilteredCategories(
      allCategories.filter((category) =>
        category.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [query, allCategories]);

  return (
    <div>
      <Combobox
        immediate
        multiple
        value={categories}
        onChange={(newCategories) => {
          onChange(newCategories);
          setQuery("");
        }}
      >
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded border border-gray-500 bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <ComboboxInput
              className="w-full border-none p-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 dark:bg-blue-950 dark:text-gray-200"
              displayValue={() => query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
              <FontAwesomeIcon
                icon={faSearch}
                size="lg"
                className="text-gray-500"
              />
            </ComboboxButton>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-blue-950 sm:text-sm">
              {filteredCategories.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-100">
                  Nothing found.
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <ComboboxOption
                    key={category.id}
                    className={({ active }) =>
                      `group relative cursor-default select-none ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-gray-900 dark:text-gray-300"
                      }`
                    }
                    value={category}
                  >
                    {({ selected }) => (
                      <div className="flex flex-row items-center">
                        <span
                          className={`block cursor-pointer truncate py-2 pl-4 pr-2.5 ${
                            selected ? "font-bold" : "font-normal"
                          }`}
                        >
                          {category.emoji} {category.name}
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
                ))
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </Combobox>
      <div className="mt-2 flex flex-wrap items-start gap-2">
        {categories.map((category: Category, cat_index: number) => {
          return (
            <div
              className="group flex w-auto cursor-pointer flex-row items-center rounded bg-blue-200 p-2 text-sm dark:bg-blue-700"
              key={cat_index}
              onClick={() => {
                onChange([
                  ...categories.slice(0, cat_index),
                  ...categories.slice(cat_index + 1),
                ]);
              }}
            >
              <FontAwesomeIcon
                className="mr-2 cursor-pointer text-gray-400 group-hover:text-gray-500 dark:text-blue-500 dark:group-hover:text-gray-200"
                icon={faX}
              ></FontAwesomeIcon>
              <span>
                {category.emoji} {category.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryPicker;
