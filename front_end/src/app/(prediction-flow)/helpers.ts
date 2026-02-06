import { isNil } from "lodash";

import { PredictionFlowPost } from "@/types/post";
import { isForecastActive } from "@/utils/forecasts/helpers";

import { PREDICTION_FLOW_COMMENTS_TOGGLE_ID } from "./components/prediction_flow_comments";

export function isPostStale(post: PredictionFlowPost) {
  // minimum 20% of the question's lifetime elapsed since the forecast
  const STALE_THRESHOLD = 0.2;
  if (
    !isNil(post.question?.my_forecast) &&
    isForecastActive(post.question.my_forecast.latest)
  ) {
    return post.question.my_forecast.lifetime_elapsed > STALE_THRESHOLD;
  }
  if (!isNil(post.group_of_questions)) {
    return post.group_of_questions.questions.some(
      (question) =>
        !isNil(question.my_forecast) &&
        isForecastActive(question.my_forecast.latest) &&
        question.my_forecast.lifetime_elapsed > STALE_THRESHOLD
    );
  }
  if (!isNil(post.conditional)) {
    return (
      (!isNil(post.conditional.question_no.my_forecast) &&
        isForecastActive(post.conditional.question_no.my_forecast.latest) &&
        post.conditional.question_no.my_forecast.lifetime_elapsed >
          STALE_THRESHOLD) ||
      (!isNil(post.conditional.question_yes.my_forecast) &&
        isForecastActive(post.conditional.question_yes.my_forecast.latest) &&
        post.conditional.question_yes.my_forecast.lifetime_elapsed >
          STALE_THRESHOLD)
    );
  }
  return false;
}

export function isPostWithSignificantMovement(post: PredictionFlowPost) {
  if (!isNil(post.question?.my_forecast)) {
    return (
      !isNil(post.question.my_forecast.movement) &&
      isForecastActive(post.question.my_forecast.latest)
    );
  }
  if (!isNil(post.group_of_questions)) {
    return post.group_of_questions.questions.some(
      (question) =>
        !isNil(question.my_forecast?.movement) &&
        isForecastActive(question.my_forecast.latest)
    );
  }
  if (!isNil(post.conditional)) {
    return (
      (!isNil(post.conditional.question_no.my_forecast?.movement) &&
        isForecastActive(post.conditional.question_no.my_forecast.latest)) ||
      (!isNil(post.conditional.question_yes.my_forecast?.movement) &&
        isForecastActive(post.conditional.question_yes.my_forecast.latest))
    );
  }
  return false;
}

export function openFlowCommentsAndScrollToComment(commentId: number) {
  if (typeof window === "undefined") return;

  const HEADER_OFFSET_PX = 52;
  const hash = `comment-${commentId}`;

  const setHashNoScroll = (nextHash: string) => {
    const url = new URL(window.location.href);
    url.hash = nextHash;
    history.replaceState(null, "", url);
    window.dispatchEvent(new Event("hashchange"));
  };

  if (window.location.hash !== `#${hash}`) {
    setHashNoScroll(hash);
  }

  const wrapper = document.getElementById(PREDICTION_FLOW_COMMENTS_TOGGLE_ID);
  const toggleBtn =
    wrapper?.querySelector<HTMLButtonElement>("button[aria-expanded]") ?? null;

  const wasClosed = toggleBtn?.getAttribute("aria-expanded") === "false";
  if (wasClosed) toggleBtn.click();

  const scrollToElWithOffset = (el: HTMLElement) => {
    const prev = el.style.scrollMarginTop;
    el.style.scrollMarginTop = `${HEADER_OFFSET_PX}px`;
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      el.style.scrollMarginTop = prev;
    }, 1000);
  };

  const tryScroll = (attempt = 0) => {
    const el = document.getElementById(hash);
    if (el) {
      scrollToElWithOffset(el);

      window.setTimeout(() => {
        const top = el.getBoundingClientRect().top;
        if (top < HEADER_OFFSET_PX - 4 || top > HEADER_OFFSET_PX + 12) {
          scrollToElWithOffset(el);
        }
      }, 250);

      return;
    }

    if (attempt < 25) window.setTimeout(() => tryScroll(attempt + 1), 120);
  };

  window.setTimeout(() => tryScroll(), wasClosed ? 350 : 0);
}
