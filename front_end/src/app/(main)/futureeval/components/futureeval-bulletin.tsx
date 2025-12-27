"use client";

import Bulletin from "@/app/(main)/components/bulletin";
import { useModal } from "@/contexts/modal_context";

const FutureEvalBulletin: React.FC = () => {
  const { setCurrentModal } = useModal();
  return (
    <Bulletin
      className="mx-auto [&>div]:bg-violet-50 [&>div]:dark:bg-violet-50-dark"
      text={
        <p>
          Congratulations for finding this page! It&apos;s still a Work In
          Progress, so please take everything presented here with a grain of
          salt. If you would like to know more, feel free to{" "}
          <span
            className="cursor-pointer font-semibold hover:underline"
            onClick={() => setCurrentModal({ type: "contactUs" })}
          >
            contact us
          </span>
          .
        </p>
      }
    />
  );
};

export default FutureEvalBulletin;
