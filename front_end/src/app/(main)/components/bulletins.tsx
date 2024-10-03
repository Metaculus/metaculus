import { FC } from "react";

import MiscApi from "@/services/misc";

import Bulletin from "./bulletin";

const Bulletins: FC = async () => {
  const bulletins = await MiscApi.getBulletins();

  return (
    <div className="mt-12 flex w-full flex-col items-center justify-center bg-transparent">
      {bulletins.map((bulletin, idx) => (
        <div className="w-full max-w-5xl px-3 sm:w-2/3 sm:px-0" key={idx}>
          <Bulletin text={bulletin.text} id={bulletin.id}></Bulletin>
        </div>
      ))}
    </div>
  );
};

export default Bulletins;
