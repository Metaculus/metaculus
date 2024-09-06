"use client";

import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useState } from "react";
import { cancelBulletin } from "../actions";

const Bulletin: FC<{ text: string; id: number }> = ({ text, id }) => {
  const [hidden, setHidden] = useState(false);

  return (
    <div
      className={
        `mb-2 mt-2 flex flex-col items-start border-2 border-solid border-sky-500 p-4` +
        (hidden ? " hidden" : "")
      }
    >
      <FontAwesomeIcon
        className="inline cursor-pointer pl-2 pt-2 text-2xl"
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
