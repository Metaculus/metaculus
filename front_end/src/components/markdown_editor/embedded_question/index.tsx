"use client";
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
import Link from "next/link";
import { FC, useEffect, useState } from "react";

import { getPost } from "@/app/(main)/questions/actions";
import createEditorComponent from "@/components/markdown_editor/createJsxComponent";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostWithForecasts } from "@/types/post";

import EmbeddedQuestionCard from "./embedded_question_card";

type Props = {
  id: number;
};

const EmbeddedQuestion: FC<Props> = ({ id }) => {
  const [postData, setPostData] = useState<PostWithForecasts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const deleteQuestion = useLexicalNodeRemove();
  const isEditorReadonly = useCellValue(readOnly$);

  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      const post = await getPost(id);
      setPostData(post);
      setIsLoading(false);
    };

    void loadPost();
  }, [id]);

  return (
    <div className="mx-auto mt-2 w-[400px]">
      {isLoading ? (
        <LoadingIndicator />
      ) : postData ? (
        <div className="flex flex-col">
          {!isEditorReadonly && (
            <Button
              onClick={deleteQuestion}
              className="self-end"
              presentationType="icon"
              variant="text"
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          )}

          <Link href={`/questions/${postData.id}`} className="no-underline">
            <EmbeddedQuestionCard postData={postData} />
          </Link>
        </div>
      ) : (
        <div>Question {id} not found</div>
      )}
    </div>
  );
};

export const EmbedQuestionAction: FC = () => {
  const insertJsx = usePublisher(insertJsx$);
  return (
    <Button
      variant="tertiary"
      onClick={() => {
        const id = prompt("Enter question id");

        if (id) {
          insertJsx({
            name: EmbeddedQuestion.name,
            kind: "flow",
            props: {
              id,
            },
          });
        }
      }}
    >
      + question
    </Button>
  );
};

export const embeddedQuestionDescriptor: JsxComponentDescriptor = {
  name: EmbeddedQuestion.name,
  props: [{ name: "id", type: "number", required: true }],
  kind: "flow",
  hasChildren: false,
  Editor: createEditorComponent(EmbeddedQuestion),
};

export default EmbeddedQuestion;
