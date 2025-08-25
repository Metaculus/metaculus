"use client";

import { useTranslations } from "next-intl";
import React, { FC, useState } from "react";

import ChangeEmailModal from "@/app/(main)/accounts/settings/components/change_email";
import Button from "@/components/ui/button";
import { CurrentUser } from "@/types/users";

export type Props = {
  user: CurrentUser;
};

const EmailEdit: FC<Props> = ({ user }) => {
  const t = useTranslations();
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);

  return (
    <section>
      <div className="mb-4 text-gray-500 dark:text-gray-500-dark">
        {t("settingsUserEmail")}
      </div>
      <div className="text-sm">
        <span className="pr-2.5">{user.email}</span>{" "}
        <Button
          variant="link"
          className="text-blue-700 dark:text-blue-700-dark"
          onClick={() => setIsChangeEmailModalOpen(true)}
        >
          {t("edit")}
        </Button>
        <ChangeEmailModal
          isOpen={isChangeEmailModalOpen}
          onClose={() => setIsChangeEmailModalOpen(false)}
        />
      </div>
    </section>
  );
};

export default EmailEdit;
