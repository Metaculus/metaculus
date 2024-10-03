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
        "relative mb-2 mt-2 flex flex-col items-start rounded border-2 border-solid border-blue-700 bg-blue-400 p-4 pr-8 pt-6 dark:border-blue-700 dark:bg-blue-800",
        {
          hidden: hidden,
        }
      )}
    >
      <FontAwesomeIcon
        className="absolute right-3 top-3 inline cursor-pointer text-2xl"
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
