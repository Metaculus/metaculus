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
import { FC, memo, useEffect, useState } from "react";

import { getPost } from "@/app/(main)/questions/actions";
import ForecastCard from "@/components/forecast_card";
import EmbedQuestionModal from "@/components/markdown_editor/embedded_question/embed_question_modal";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostWithForecasts } from "@/types/post";
import { logError } from "@/utils/errors";

import createEditorComponent from "../createJsxComponent";
import useLexicalBackspaceNodeRemove from "../hooks/use_backspace_node_remove";

type Props = {
  id: number;
};

const COMPONENT_NAME = "EmbeddedQuestion";

const EmbeddedQuestion: FC<Props> = ({ id }) => {
  const [postData, setPostData] = useState<PostWithForecasts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const deleteQuestion = useLexicalNodeRemove();
  const isReadOnly = useCellValue(readOnly$);

  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      try {
        const post = await getPost(id);
        setPostData(post);
      } catch (e) {
        logError(e);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPost();
  }, [id]);

  const { ref, getReferenceProps } =
    useLexicalBackspaceNodeRemove<HTMLDivElement>(!isReadOnly);

  return (
    <div
      ref={ref}
      className="mx-auto mt-2 w-full ring-blue-500 focus:outline-none focus:ring-2 dark:ring-blue-500-dark"
      {...getReferenceProps()}
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : postData ? (
        <div className="flex flex-col">
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

          <ForecastCard
            post={postData}
            withZoomPicker
            navigateToNewTab
            className="min-h-72"
          />
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
      name: COMPONENT_NAME,
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
  name: COMPONENT_NAME,
  props: [{ name: "id", type: "number", required: true }],
  kind: "flow",
  hasChildren: false,
  Editor: createEditorComponent(MemorizedEmbeddedQuestion),
};

export default MemorizedEmbeddedQuestion;
