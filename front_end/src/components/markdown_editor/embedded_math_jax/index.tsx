import {
  faSquareRootVariable,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  insertJsx$,
  JsxComponentDescriptor,
  readOnly$,
  useCellValue,
  useLexicalNodeRemove,
  usePublisher,
} from "@mdxeditor/editor";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import classNames from "classnames";
import React, { FC } from "react";

import createEditorComponent from "@/components/markdown_editor/createJsxComponent";
import MathJaxContent from "@/components/math_jax_content";
import Button from "@/components/ui/button";

import useLexicalBackspaceNodeRemove from "../hooks/use_backspace_node_remove";

type MathJaxRendererProps = {
  content: string;
};

const COMPONENT_NAME = "EmbeddedMathJax";

const EmbeddedMathJax: React.FC<MathJaxRendererProps> = ({ content }) => {
  const isReadOnly = useCellValue(readOnly$);
  const deleteMathJax = useLexicalNodeRemove();

  const isInline = content.startsWith("\\(") && content.endsWith("\\)");

  const { ref, getReferenceProps } =
    useLexicalBackspaceNodeRemove<HTMLDivElement>(!isReadOnly);

  return (
    <div
      ref={ref}
      className={classNames(
        "items-center justify-center ring-blue-500 focus:outline-none focus:ring-2 dark:ring-blue-500-dark",
        isInline ? "inline-flex" : "flex w-full"
      )}
      {...getReferenceProps()}
    >
      <MathJaxContent content={content} />
      {!isReadOnly && (
        <Button onClick={deleteMathJax} presentationType="icon" variant="text">
          <FontAwesomeIcon icon={faXmark} />
        </Button>
      )}
    </div>
  );
};

export const EmbedMathJaxAction: FC = () => {
  const insertJsx = usePublisher(insertJsx$);

  return (
    <Button
      presentationType="icon"
      variant="text"
      onClick={() => {
        const formula = prompt("Enter a block LaTeX formula", "\\[e=mc^2\\]");
        if (formula) {
          insertJsx({
            name: COMPONENT_NAME,
            kind: "flow",
            props: {
              content: formula,
            },
          });
        }
      }}
    >
      <FontAwesomeIcon icon={faSquareRootVariable} />
    </Button>
  );
};

export const mathJaxDescriptor: JsxComponentDescriptor = {
  name: COMPONENT_NAME,
  props: [{ name: "content", type: "string", required: true }],
  kind: "text",
  hasChildren: false,
  Editor: createEditorComponent(EmbeddedMathJax),
};

export default EmbeddedMathJax;
