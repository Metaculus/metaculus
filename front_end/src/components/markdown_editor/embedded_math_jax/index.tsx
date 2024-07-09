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
import React, { FC } from "react";

import createEditorComponent from "@/components/markdown_editor/createJsxComponent";
import Button from "@/components/ui/button";

type MathJaxRendererProps = {
  content: string;
};

const EmbeddedMathJax: React.FC<MathJaxRendererProps> = ({ content }) => {
  const isReadOnly = useCellValue(readOnly$);
  const deleteMathJax = useLexicalNodeRemove();

  return (
    <div className="flex flex-col">
      {!isReadOnly && (
        <Button
          onClick={deleteMathJax}
          className="self-end"
          presentationType="icon"
          variant="text"
        >
          <FontAwesomeIcon icon={faXmark} />
        </Button>
      )}

      <MathJaxContext>
        <MathJax dynamic>{content}</MathJax>
      </MathJaxContext>
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
            name: EmbeddedMathJax.name,
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
  name: EmbeddedMathJax.name,
  props: [{ name: "content", type: "string", required: true }],
  kind: "flow",
  hasChildren: false,
  Editor: createEditorComponent(EmbeddedMathJax),
};

export default EmbeddedMathJax;
