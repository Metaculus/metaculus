"use client";

import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { FC, useState } from "react";

import { cancelBulletin } from "../actions";

const Bulletin: FC<{ text: string; id: number }> = ({ text, id }) => {
  const [hidden, setHidden] = useState(false);

  return (
    <div
      className={classNames(
        "relative flex flex-col items-start rounded border border-solid border-blue-700/50 bg-blue-400/75 p-4 pr-8 text-blue-800 dark:border-blue-700/75 dark:bg-blue-800 dark:text-blue-200",
        {
          hidden: hidden,
        }
      )}
    >
      <FontAwesomeIcon
        className="absolute right-3 top-3 inline cursor-pointer text-xl text-blue-600 hover:text-blue-800 dark:text-blue-600 dark:hover:text-blue-400"
        icon={faClose}
        onClick={async () => {
          await cancelBulletin(id);
          setHidden(true);
        }}
      />
      <div>
        {text.split("\n").map((line, lineIdx) => (
          <p key={lineIdx}>{line}</p>
        ))}
      </div>
    </div>
  );
};

export default Bulletin;
