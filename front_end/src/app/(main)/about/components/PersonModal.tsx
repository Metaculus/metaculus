import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DialogTitle } from "@headlessui/react";
import React, { FC } from "react";

import { sanitizeHtmlContent } from "@/utils/markdown";

import MetaculusLogo from "./MetacLogo";
import ModalWithArrows from "./ModalWithArrows";
import { Group, Groups, Person } from "./TeamBlock";

type Props = {
  people: Person[];
  randomizedGroups: Groups;
  groupName: Group;
  personsName: string;
  setOpenPerson: React.Dispatch<
    React.SetStateAction<{ groupName: Group; personsName: Person["name"] }>
  >;
};

const PersonModal: FC<Props> = ({
  people,
  randomizedGroups,
  groupName,
  personsName,
  setOpenPerson,
}) => {
  const group = randomizedGroups[groupName];
  const previousPersonsName = group[group.indexOf(personsName) - 1];
  const nextPersonsName = group[group.indexOf(personsName) + 1];

  const onPrevious = () =>
    previousPersonsName &&
    setOpenPerson({ groupName, personsName: previousPersonsName });
  const onNext = () =>
    nextPersonsName &&
    setOpenPerson({ groupName, personsName: nextPersonsName });

  const person = people.find(({ name }) => name === personsName);
  if (!person) return null;

  const { name, position, imgSrc, socials, introduction, userId } = person;

  const handleClose = () =>
    setOpenPerson({ groupName: "team", personsName: "" });

  return (
    <ModalWithArrows
      open
      onClose={handleClose}
      onPrevious={onPrevious}
      previousDisabled={!previousPersonsName}
      onNext={onNext}
      nextDisabled={!nextPersonsName}
      className="max-h-full w-full max-w-lg md:max-w-2xl"
    >
      <div className="flex min-h-[506px] flex-col gap-x-6 md:min-h-[320px] md:flex-row">
        <div className="mx-auto w-40">
          <img
            alt={name}
            className="row-span-2 mx-auto mb-4 w-full max-w-[160px]"
            src={imgSrc}
          />
          {(userId || socials) && (
            <div className="my-2 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-400-dark">
              {!!userId && (
                <a
                  aria-label="Metaculus profile"
                  href={`/accounts/profile/${userId}/`}
                  className="inline-flex size-7 items-center justify-center rounded-sm bg-gray-400 text-gray-0 hover:bg-blue-700 hover:text-gray-0 dark:bg-gray-500 dark:text-gray-900 hover:dark:bg-blue-300"
                >
                  <MetaculusLogo className="h-7 w-7" />
                </a>
              )}
              {socials &&
                socials.map(({ link, platform }) => (
                  <a
                    className="inline-flex items-center justify-center hover:text-blue-700 hover:dark:text-blue-300"
                    key={link}
                    href={link}
                    target="_blank"
                    aria-label={`${name} ${platform}`}
                    rel="noreferrer"
                  >
                    {platform === "LinkedIn" && (
                      <FontAwesomeIcon icon={faLinkedin} size="2xl" />
                    )}
                  </a>
                ))}
            </div>
          )}
        </div>
        <div className="flex-1">
          <DialogTitle className="mb-2 mt-0 text-center text-blue-900 dark:text-blue-900-dark md:mr-8 md:text-left">
            {personsName}
          </DialogTitle>
          {position && (
            <p className="my-2 text-center text-lg leading-tight text-blue-700 dark:text-blue-700-dark md:text-left">
              {position}
            </p>
          )}
          <p
            className="mb-0 mt-4 text-sm text-gray-700 dark:text-gray-700-dark"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlContent(introduction),
            }}
          />
        </div>
      </div>
    </ModalWithArrows>
  );
};

export default PersonModal;
