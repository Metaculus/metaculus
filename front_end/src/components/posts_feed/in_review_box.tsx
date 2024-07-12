"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

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
    </CollapsibleBox>
  );
};

export default InReviewBox;
