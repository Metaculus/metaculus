import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import MiscApi from "@/services/misc";

import Bulletin from "./bulletin";

const Bulletins: FC = async () => {
  const bulletins = await MiscApi.getBulletins();

  return (
    <div className="mt-12 flex w-full flex-col items-center justify-center bg-transparent">
      {bulletins.map((bulletin) => (
        <Bulletin
          key={bulletin.id}
          text={bulletin.text}
          id={bulletin.id}
        ></Bulletin>
      ))}
    </div>
  );
};

export default WithServerComponentErrorBoundary(Bulletins);
