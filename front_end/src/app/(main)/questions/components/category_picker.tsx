"use client";

import { faSearch, faX } from "@fortawesome/free-solid-svg-icons";
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
    console.log("HERE !");
    setFilteredCategories(
      allCategories.filter((category) =>
        category.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [query]);

  return (
    <div>
      <Combobox multiple>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <ComboboxInput
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 dark:text-gray-200"
              displayValue={(categories: Category[]) => query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
              <FontAwesomeIcon
                icon={faSearch}
                className="h-5 w-5 text-gray-400"
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
            <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredCategories.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-100">
                  Nothing found.
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <ComboboxOption
                    key={category.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active
                          ? "bg-teal-600 text-white"
                          : "text-gray-900 dark:text-gray-300"
                      }`
                    }
                    value={category}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          onClick={() => {
                            setQuery("");
                            setFilteredCategories([]);
                            onChange([...categories, category]);
                          }}
                          className={`block cursor-pointer truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {category.name}
                        </span>
                      </>
                    )}
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </Combobox>
      <div className="flex flex-col">
        {categories.map((category: Category, cat_index: number) => {
          return (
            <div
              className="m-2 w-min min-w-[220px] border p-2 text-xs"
              key={cat_index}
            >
              <FontAwesomeIcon
                onClick={(e) => {
                  onChange([
                    ...categories.slice(0, cat_index),
                    ...categories.slice(cat_index + 1),
                  ]);
                }}
                className="text-red mr-2 cursor-pointer text-red-500"
                icon={faX}
              ></FontAwesomeIcon>
              <span>{category.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryPicker;
