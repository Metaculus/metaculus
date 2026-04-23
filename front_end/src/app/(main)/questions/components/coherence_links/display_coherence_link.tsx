import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import {
  deleteCoherenceLink,
  swapCoherenceLink,
  updateCoherenceLink,
} from "@/app/(main)/questions/actions";
import LinkStrengthIcon from "@/app/(main)/questions/components/coherence_links/link_strength_icon";
import CoherencePredictionTile from "@/app/(main)/questions/components/coherence_links/coherence_prediction_tile";
import Button from "@/components/ui/button";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CoherenceLink } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question, QuestionWithForecasts } from "@/types/question";
import { getPostLink } from "@/utils/navigation";

type Props = {
  link: CoherenceLink;
  post: Post;
  compact: boolean;
};

const DisplayCoherenceLink: FC<Props> = ({ link, post, compact }) => {
  const isFirstQuestion = link.question1_id === post.question?.id;
  const [otherQuestion, setOtherQuestion] = useState<
    QuestionWithForecasts | Question | null
  >(null);
  const [canceled, setCanceled] = useState<boolean>(false);
  // Local state lets the popover feel responsive without waiting for the context
  // refetch. If the server call fails the context refresh will realign.
  const [direction, setDirection] = useState<number>(link.direction);
  const [strength, setStrength] = useState<number>(link.strength);
  const { updateCoherenceLinks } = useCoherenceLinksContext();

  useEffect(() => {
    setDirection(link.direction);
    setStrength(link.strength);
  }, [link.direction, link.strength]);

  const otherQuestionID = isFirstQuestion
    ? link.question2_id
    : link.question1_id;
  const embeddedOtherQuestion = isFirstQuestion
    ? link.question2
    : link.question1;

  useEffect(() => {
    let cancelled = false;
    // Seed with the embedded question so we have *something* to render while the
    // full fetch is in flight. The embedded copy lacks CP data, so we fetch the
    // full question to drive the CP bar.
    setOtherQuestion((prev) => prev ?? embeddedOtherQuestion ?? null);
    ClientPostsApi.getQuestion(otherQuestionID)
      .then((q) => {
        if (!cancelled) setOtherQuestion(q);
      })
      .catch(() => {
        // Permission errors fall back to the embedded question (already set).
      });
    return () => {
      cancelled = true;
    };
    // Only refetch when the target question actually changes. Depending on
    // `link` would cause every row to refetch whenever the context reloads
    // (e.g. after editing any single link), which wipes CP data mid-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherQuestionID]);

  async function deleteLink() {
    setCanceled(true);
    await deleteCoherenceLink(link);
    await updateCoherenceLinks();
  }

  async function changeLink(nextDirection: number, nextStrength: number) {
    setDirection(nextDirection);
    setStrength(nextStrength);
    await updateCoherenceLink(link.id, nextDirection, nextStrength);
    await updateCoherenceLinks();
  }

  async function swapLink() {
    await swapCoherenceLink(link.id);
    await updateCoherenceLinks();
  }

  if (!otherQuestion || canceled) return null;

  if (compact)
    return (
      <div>
        <Link href={getPostLink({ id: otherQuestion.post_id })} target="_blank">
          <b>{otherQuestion.title}</b>
        </Link>
        <Button
          onClick={deleteLink}
          className={"border-none !bg-inherit p-1 text-sm underline"}
        >
          (unlink)
        </Button>
      </div>
    );

  // The "target" is the question being causally influenced — the one whose type
  // determines the verb (increases/hastens/positive).
  const targetType =
    (isFirstQuestion ? otherQuestion?.type : post.question?.type) ?? null;
  const otherQuestionWithForecasts =
    "aggregations" in otherQuestion
      ? (otherQuestion as QuestionWithForecasts)
      : null;

  return (
    <div
      className={
        "group relative flex flex-row items-center gap-3 rounded border border-blue-400 bg-gray-0 p-4 transition-colors hover:border-blue-500 dark:border-blue-400-dark dark:bg-gray-0-dark dark:hover:border-blue-500-dark"
      }
    >
      <Link
        href={getPostLink({ id: otherQuestion.post_id })}
        target="_blank"
        className="flex-grow font-normal text-blue-700 no-underline hover:text-blue-800 hover:underline dark:text-blue-700-dark dark:hover:text-blue-800-dark"
      >
        {otherQuestion.title}
      </Link>
      {otherQuestionWithForecasts && (
        <CoherencePredictionTile question={otherQuestionWithForecasts} />
      )}
      <div className={"flex flex-row items-center gap-1"}>
        <LinkStrengthIcon
          direction={direction}
          strength={strength}
          targetType={targetType}
          onChange={changeLink}
          onSwap={swapLink}
        />
      </div>
      <button
        type="button"
        onClick={deleteLink}
        aria-label="Delete link"
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-salmon-500 text-xs text-gray-0 opacity-0 shadow transition-opacity hover:bg-salmon-600 focus-visible:opacity-100 group-hover:opacity-100 dark:bg-salmon-500-dark dark:text-gray-0-dark dark:hover:bg-salmon-600-dark"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
};
export default DisplayCoherenceLink;
