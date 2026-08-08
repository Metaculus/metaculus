"use client";

import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { FlowHeaderActions } from "@/components/flow/flow_header";
import Button from "@/components/ui/button";

const LoadingHeaderActions = () => {
  const t = useTranslations();
  const params = useParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const exitHref = slug ? `/tournament/${slug}` : "/tournaments";

  return (
    <FlowHeaderActions>
      <Button className="mr-2 hidden sm:block" href={exitHref}>
        {t("exitPredictionFlow")}
      </Button>
      <Button
        className="mr-2 border-none bg-transparent text-gray-0 dark:text-gray-0-dark sm:hidden"
        href={exitHref}
        variant="primary"
        aria-label={t("exitPredictionFlow")}
      >
        <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
      </Button>
    </FlowHeaderActions>
  );
};

export default LoadingHeaderActions;
