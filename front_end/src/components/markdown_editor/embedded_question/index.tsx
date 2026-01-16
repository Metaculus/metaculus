"use client";
import "./styles.scss";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  insertJsx$,
  JsxComponentDescriptor,
  readOnly$,
  useCellValue,
  useLexicalNodeRemove,
  usePublisher,
} from "@mdxeditor/editor";
import { useTranslations } from "next-intl";
import { FC, memo, useEffect, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import {
  EMBED_QUESTION_TITLE,
  ENFORCED_THEME_PARAM,
  GRAPH_ZOOM_PARAM,
} from "@/constants/global_search_params";
import { ContinuousQuestionTypes } from "@/constants/questions";
import { useEmbedUrl } from "@/hooks/share";
import useAppTheme from "@/hooks/use_app_theme";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { TimelineChartZoomOption } from "@/types/charts";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { logError } from "@/utils/core/errors";
import { addUrlParams } from "@/utils/navigation";

import createEditorComponent from "../createJsxComponent";
import EmbedQuestionModal from "./embed_question_modal";
import useLexicalBackspaceNodeRemove from "../hooks/use_backspace_node_remove";

type Props = {
  id: number;
};

export const EMBEDDED_QUESTION_COMPONENT_NAME = "EmbeddedQuestion";
const EMBED_MAX_WIDTH = 550;

function isBinaryOrContinuousQuestion(qType?: QuestionType) {
  if (!qType) return false;
  return (
    qType === QuestionType.Binary ||
    ContinuousQuestionTypes.some((t) => t === qType)
  );
}

function isFanChartPost(post: PostWithForecasts) {
  return (
    !!post.group_of_questions &&
    post.group_of_questions.graph_type === GroupOfQuestionsGraphType.FanGraph
  );
}

const EmbeddedQuestion: FC<Props> = ({ id }) => {
  const [postData, setPostData] = useState<PostWithForecasts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const deleteQuestion = useLexicalNodeRemove();
  const isReadOnly = useCellValue(readOnly$);

  const { ref, getReferenceProps } =
    useLexicalBackspaceNodeRemove<HTMLDivElement>(!isReadOnly);
  const [shellEl, setShellEl] = useState<HTMLDivElement | null>(null);
  const [shellWidth, setShellWidth] = useState<number>(EMBED_MAX_WIDTH);

  useEffect(() => {
    if (!shellEl) return;

    const update = () =>
      setShellWidth(Math.ceil(shellEl.getBoundingClientRect().width));

    update();
    const ro = new ResizeObserver(update);
    ro.observe(shellEl);

    return () => ro.disconnect();
  }, [shellEl]);

  const embedUrl = useEmbedUrl(`/questions/embed/${id}`);
  const { theme: appTheme } = useAppTheme();

  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      try {
        const post = await ClientPostsApi.getPost(id);
        setPostData(post);
      } catch (e) {
        logError(e);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPost();
  }, [id]);

  const iFrameSrc = useMemo(() => {
    if (!embedUrl) return null;
    return addUrlParams(embedUrl, [
      { paramName: ENFORCED_THEME_PARAM, paramValue: appTheme },
      // keep parity with your embed modal defaults
      { paramName: GRAPH_ZOOM_PARAM, paramValue: TimelineChartZoomOption.All },
      ...(postData?.title
        ? [{ paramName: EMBED_QUESTION_TITLE, paramValue: postData.title }]
        : []),
    ]);
  }, [embedUrl, appTheme, postData?.title]);

  const embedHeight = useMemo(() => {
    if (!postData) return 360;
    const effectiveWidth = Math.min(shellWidth, EMBED_MAX_WIDTH);
    const qType = postData.question?.type;

    const isBinaryOrContinuous = isBinaryOrContinuousQuestion(qType);
    const fan = isFanChartPost(postData);
    if (isBinaryOrContinuous) return effectiveWidth < 418 ? 390 : 360;
    if (fan) return effectiveWidth < 480 ? 290 : 360;
    return effectiveWidth < 418 ? 290 : 270;
  }, [postData, shellWidth]);

  return (
    <div
      ref={ref}
      className="mx-auto mt-2 w-full ring-blue-500 focus:outline-none focus:ring-2 dark:ring-blue-500-dark"
      {...getReferenceProps()}
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : postData ? (
        <div ref={setShellEl} className="flex flex-col">
          {!isReadOnly && (
            <Button
              onClick={deleteQuestion}
              className="self-end"
              presentationType="icon"
              variant="text"
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          )}

          {iFrameSrc ? (
            <div className="mt-1 max-w-full overflow-x-hidden">
              <iframe
                title={postData.title ?? `Question ${id}`}
                className="mx-auto block border-0"
                src={iFrameSrc}
                style={{
                  height: embedHeight,
                  width: "100%",
                  maxWidth: EMBED_MAX_WIDTH,
                }}
              />
            </div>
          ) : (
            <div className="mx-auto w-[400px] bg-blue-200 p-3 dark:bg-blue-200-dark">
              Failed to build embed URL
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto w-[400px] bg-blue-200 p-3 dark:bg-blue-200-dark">
          Question {id} not found
        </div>
      )}
    </div>
  );
};

export const EmbedQuestionAction: FC = () => {
  const insertJsx = usePublisher(insertJsx$);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations();

  const handleSelectQuestion = (id: number) => {
    insertJsx({
      name: EMBEDDED_QUESTION_COMPONENT_NAME,
      kind: "flow",
      props: {
        id: id.toString(),
      },
    });
  };

  return (
    <>
      <Button
        variant="tertiary"
        className="whitespace-nowrap"
        onClick={() => setIsModalOpen(true)}
      >
        + {t("question")}
      </Button>
      <EmbedQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onQuestionSelect={handleSelectQuestion}
      />
    </>
  );
};

const MemorizedEmbeddedQuestion = memo(EmbeddedQuestion);
export const embeddedQuestionDescriptor: JsxComponentDescriptor = {
  name: EMBEDDED_QUESTION_COMPONENT_NAME,
  props: [{ name: "id", type: "number", required: true }],
  kind: "flow",
  hasChildren: false,
  Editor: createEditorComponent(MemorizedEmbeddedQuestion),
};

export default MemorizedEmbeddedQuestion;
