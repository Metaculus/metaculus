"use client";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";

import DriverCreationForm from "@/app/(main)/questions/[id]/components/key_factors/add_modal/driver_creation_form";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { KeyFactorDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";

import KeyFactorsSuggestedItems from "./key_factors_suggested_items";

const FACTORS_PER_COMMENT = 4;

type Props = {
  drafts: KeyFactorDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<KeyFactorDraft[]>>;
  limitError?: string;
  factorsLimit: number;
  suggestedKeyFactors: KeyFactorDraft[];
  setSuggestedKeyFactors: React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >;
  post: PostWithForecasts;
};

const KeyFactorsAddForm: React.FC<Props> = ({
  drafts,
  setDrafts,
  factorsLimit,
  limitError,
  suggestedKeyFactors,
  setSuggestedKeyFactors,
  post,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  useEffect(() => {
    if (suggestedKeyFactors.length > 0) {
      setDrafts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const totalKeyFactorsLimitReached =
    drafts.length + suggestedKeyFactors.length >=
    Math.min(factorsLimit, FACTORS_PER_COMMENT);

  return (
    <div className="flex w-full flex-col gap-4">
      {suggestedKeyFactors.length > 0 && (
        <KeyFactorsSuggestedItems
          drafts={drafts}
          post={post}
          setDrafts={setDrafts}
          setSuggestedKeyFactors={setSuggestedKeyFactors}
          suggestedKeyFactors={suggestedKeyFactors}
          user={user}
        />
      )}

      <div className="flex flex-col gap-3">
        {suggestedKeyFactors.length === 0 && (
          <p className="m-0 mb-2 text-base leading-tight">
            {t("addDriverModalDescription")}
          </p>
        )}

        {drafts.map((draft, idx) => (
          <DriverCreationForm
            key={idx}
            draft={draft}
            setDraft={(d) =>
              setDrafts(drafts.map((k, i) => (i === idx ? d : k)))
            }
            showXButton={idx > 0 || !!suggestedKeyFactors.length}
            onXButtonClick={() => {
              setDrafts(drafts.filter((_, i) => i !== idx));
            }}
            post={post}
          />
        ))}

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
            totalKeyFactorsLimitReached ||
            drafts.at(-1)?.driver.text === "" ||
            !isNil(limitError)
          }
        >
          <FontAwesomeIcon icon={faPlus} className="size-4" />
          {t("addAnother")}
        </Button>
      </div>
    </div>
  );
};

export default KeyFactorsAddForm;
