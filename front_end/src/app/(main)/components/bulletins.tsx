import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import MiscApi from "@/services/misc";

import Bulletin from "./bulletin";

const Bulletins: FC = async () => {
  const bulletins = await MiscApi.getBulletins();

  return (
    <div className="mt-12 flex w-full flex-col items-center justify-center bg-transparent">
      {bulletins.map((bulletin, idx) => (
        <div
          className="mt-3 flex w-full max-w-5xl flex-col gap-3 px-3 sm:w-2/3 sm:px-0 md:mt-8"
          key={idx}
        >
          <Bulletin text={bulletin.text} id={bulletin.id}></Bulletin>
        </div>
      ))}
    </div>
  );
};

export default WithServerComponentErrorBoundary(Bulletins);
