"use client";

import { faSearch, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

import { Tournament } from "@/types/projects";

const ProjectPicker: React.FC<{
  tournaments: Tournament[];
  siteMain: Tournament;
  currentProject?: Tournament;
  onChange: (project: Tournament) => void;
}> = ({ tournaments, siteMain, currentProject, onChange }) => {
  const [query, setQuery] = useState<string>("");
  const [filteredProjects, setFilteredProjects] = useState<Tournament[]>([
    siteMain,
    ...tournaments,
  ]);
  const initialProject = currentProject ? currentProject : siteMain;
  const [selectedProject, setSelectedProject] =
    useState<Tournament>(initialProject);

  useEffect(() => {
    setFilteredProjects(
      [siteMain, ...tournaments].filter((project) =>
        project.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [query]);

  return (
    <div>
      <Combobox
        immediate
        multiple
        onChange={(_) => {
          onChange(selectedProject);
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
              {filteredProjects.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-100">
                  Nothing found.
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <ComboboxOption
                    key={project.id}
                    className={({ active }) =>
                      `group relative cursor-default select-none ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-gray-900 dark:text-gray-300"
                      }`
                    }
                    value={project}
                    onClick={(x) => {
                      setSelectedProject(project);
                      onChange(project);
                      setQuery("");
                      setFilteredProjects([]);
                    }}
                  >
                    {({ selected }) => (
                      <div className="flex flex-row items-center">
                        <span
                          className={`block cursor-pointer truncate py-2 pl-4 pr-2.5 ${
                            selected ? "font-bold" : "font-normal"
                          }`}
                        >
                          {project.name}
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
      <span className="text-xs">
        Selected project:
        <span className="border-1 ml-1 rounded bg-blue-600 pl-1 pr-1">
          <Link
            href={`/tournament/${selectedProject.id}`}
            className="text-white no-underline"
          >
            {selectedProject.name}
          </Link>
        </span>
      </span>
      <div></div>
      <span className="text-xs">
        Initial project:
        <span className="border-1 ml-1 rounded bg-blue-600 pl-1 pr-1">
          <Link
            href={`/tournament/${initialProject.id}`}
            className="text-white no-underline"
          >
            {initialProject.name}
          </Link>
        </span>
      </span>
    </div>
  );
};

export default ProjectPicker;
