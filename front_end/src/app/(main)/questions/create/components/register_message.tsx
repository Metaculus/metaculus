"use client";

import { useTranslations } from "next-intl";

import { CurrentModal, useModal } from "@/contexts/modal_context";

const RegisterMessage = () => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  const manageLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    type: CurrentModal
  ) => {
    e.preventDefault();
    setCurrentModal(type);
  };

  return (
    <p>
      {t.rich("onlyRegisterUserCanCreate", {
        link1: (chunks) => (
          <a
            href=""
            className="underline"
            onClick={(e) => manageLinkClick(e, { type: "signin" })}
          >
            {chunks}
          </a>
        ),
        link2: (chunks) => (
          <a
            href=""
            className="underline"
            onClick={(e) => manageLinkClick(e, { type: "signup" })}
          >
            {chunks}
          </a>
        ),
      })}
    </p>
  );
};

export default RegisterMessage;
