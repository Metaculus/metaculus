import { mergeRegister } from "@lexical/utils";
import { readOnly$, useCellValue, VoidEmitter } from "@mdxeditor/editor";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  NodeKey,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import * as React from "react";
import {
  FC,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";

import EquationEditor from "./equation_editor";
import KatexRenderer from "../../../../katex_renderer";
import { $isEquationNode } from "../equation_node";

type EquationComponentProps = {
  equation: string;
  inline: boolean;
  nodeKey: NodeKey;
  parentEditor: LexicalEditor;
  focusEmitter: VoidEmitter;
};

const EquationComponent: FC<EquationComponentProps> = ({
  equation,
  inline,
  nodeKey,
  parentEditor,
  focusEmitter,
}) => {
  const isReadOnly = useCellValue(readOnly$);
  const isEditable = !isReadOnly;
  const [equationValue, setEquationValue] = useState(equation);
  const [showEquationEditor, setShowEquationEditor] = useState<boolean>(false);
  const inputRef = useRef(null);

  useEffect(() => {
    focusEmitter.subscribe(() => {
      parentEditor.focus();
    });
  }, [parentEditor, focusEmitter]);

  const onHide = useCallback(
    (restoreSelection?: boolean) => {
      setShowEquationEditor(false);
      parentEditor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isEquationNode(node)) {
          node.setEquation(equationValue);
          if (restoreSelection) {
            node.selectNext(0, 0);
          }
        }
      });
    },
    [parentEditor, equationValue, nodeKey]
  );

  useEffect(() => {
    if (!showEquationEditor && equationValue !== equation) {
      setEquationValue(equation);
    }
  }, [showEquationEditor, equation, equationValue]);

  useEffect(() => {
    if (!isEditable) {
      return;
    }
    if (showEquationEditor) {
      const hideEditor = () => {
        const activeElement = document.activeElement;
        const inputElem = inputRef.current;
        if (inputElem !== activeElement) {
          onHide();
        }
        return false;
      };

      return mergeRegister(
        parentEditor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          hideEditor,
          COMMAND_PRIORITY_HIGH
        ),
        parentEditor.registerCommand(
          KEY_ESCAPE_COMMAND,
          hideEditor,
          COMMAND_PRIORITY_HIGH
        )
      );
    } else {
      return parentEditor.registerUpdateListener(({ editorState }) => {
        const isSelected = editorState.read(() => {
          const selection = $getSelection();
          return (
            $isNodeSelection(selection) &&
            selection.has(nodeKey) &&
            selection.getNodes().length === 1
          );
        });
        if (isSelected) {
          setShowEquationEditor(true);
        }
      });
    }
  }, [parentEditor, nodeKey, onHide, showEquationEditor, isEditable]);

  return (
    <>
      {showEquationEditor && isEditable ? (
        <EquationEditor
          equation={equationValue}
          setEquation={setEquationValue}
          inline={inline}
          ref={inputRef}
        />
      ) : (
        <ErrorBoundary
          onError={(e) => parentEditor._onError(e)}
          fallback={null}
        >
          <KatexRenderer
            equation={equationValue}
            inline={inline}
            onClick={
              isEditable
                ? () => {
                    startTransition(() => {
                      setShowEquationEditor(true);
                    });
                  }
                : undefined
            }
          />
        </ErrorBoundary>
      )}
    </>
  );
};

export default EquationComponent;
