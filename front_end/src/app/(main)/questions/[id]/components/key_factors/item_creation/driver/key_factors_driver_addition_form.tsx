"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { DriverDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { isDriverDraft } from "@/utils/key_factors";

import KeyFactorsNewDriverFields from "./key_factors_new_driver_fields";
import { useKeyFactorsCtx } from "../../key_factors_context";

const FACTORS_PER_COMMENT = 4;

type Props = {
  post: PostWithForecasts;
};

const KeyFactorsDriverAdditionForm: React.FC<Props> = ({ post }) => {
  const t = useTranslations();
  const { drafts, setDrafts, factorsLimit, limitError, suggestedKeyFactors } =
    useKeyFactorsCtx();
  const { user } = useAuth();

  if (!user) return null;

  const totalKeyFactorsLimitReached =
    drafts.length >= Math.min(factorsLimit, FACTORS_PER_COMMENT);

  const last = drafts.at(-1);
  const lastDriverEmpty =
    !!last && isDriverDraft(last) && last.driver.text === "";
  const driverDraftsCount = drafts.filter(isDriverDraft).length;

  return (
    <div className="flex w-full flex-col gap-4 antialiased">
      <div className="flex flex-col gap-3">
        {suggestedKeyFactors.length === 0 && (
          <>
            <p className="m-0 mb-2 hidden text-base leading-tight sm:block">
              {t(
                driverDraftsCount === 1
                  ? "addDriverModalDescriptionDesktop"
                  : "addDriverModalDescriptionMobile"
              )}
            </p>

            <p className="m-0 mb-2 text-base leading-tight sm:hidden">
              {t("addDriverModalDescriptionMobile")}
            </p>
          </>
        )}

        {drafts.map((draft, idx) =>
          isDriverDraft(draft) ? (
            <KeyFactorsNewDriverFields
              key={idx}
              draft={draft}
              setDraft={(next: DriverDraft) =>
                setDrafts((prev) => prev.map((k, i) => (i === idx ? next : k)))
              }
              showXButton={idx > 0 || !!suggestedKeyFactors.length}
              onXButtonClick={() =>
                setDrafts((prev) => prev.filter((_, i) => i !== idx))
              }
              post={post}
            />
          ) : null
        )}

        <Button
          variant="tertiary"
          size="xs"
          className="w-fit gap-2 px-3 py-2 text-sm font-medium !leading-none sm:text-base"
          onClick={() => {
            setDrafts([
              ...drafts,
              {
                driver: { text: "", impact_direction: null, certainty: null },
              },
            ]);
          }}
          disabled={
            totalKeyFactorsLimitReached || lastDriverEmpty || !isNil(limitError)
          }
        >
          <FontAwesomeIcon icon={faPlus} className="size-4" />
          {t("addAnother")}
        </Button>
      </div>
    </div>
  );
};

export default KeyFactorsDriverAdditionForm;
