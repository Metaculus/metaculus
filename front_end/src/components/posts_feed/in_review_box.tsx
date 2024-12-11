"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { EXPRESSION_OF_INTEREST_FORM_URL } from "@/app/(main)/pro-forecasters/constants/expression_of_interest_form";

import CollapsibleBox from "../ui/collapsible_box";

const InReviewBox: FC = () => {
  const t = useTranslations();

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <CollapsibleBox
      title={t("inReviewBoxTitle")}
      expanded={isExpanded}
      onToggleExpanded={setIsExpanded}
    >
      <p className="mb-2 mt-0">{t("inReviewBox1")}</p>
      <ul className="list-disc pl-5">
        <li>{t("inReviewBox2")}</li>
        <li>{t("inReviewBox3")}</li>
      </ul>
      <p className="mb-0 mt-2">
        {t.rich("inReviewBox4", {
          link: (chunks) => <Link href="/question-writing/">{chunks}</Link>,
        })}
      </p>
      <p className="mb-0 mt-2 text-sm">
        {t.rich("expressionOfInterestFormMessage", {
          link: (chunks) => (
            <a href={EXPRESSION_OF_INTEREST_FORM_URL}>{chunks}</a>
          ),
        })}
      </p>
    </CollapsibleBox>
  );
};

export default InReviewBox;
