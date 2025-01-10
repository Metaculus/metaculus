import { mergeRegister } from "@lexical/utils";
import { readOnly$, useCellValue, VoidEmitter } from "@mdxeditor/editor";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  NodeKey,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
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
      return mergeRegister(
        // hide editor when clicking outside
        parentEditor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem !== activeElement) {
              onHide();
            }

            return false;
          },
          COMMAND_PRIORITY_HIGH
        ),
        // hide editor when pressing esc key
        parentEditor.registerCommand(
          KEY_ESCAPE_COMMAND,
          () => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem === activeElement) {
              onHide(true);
              return true;
            }
            return false;
          },
          COMMAND_PRIORITY_HIGH
        ),
        // ignore parent editor line break and instead apply it for equation editor
        parentEditor.registerCommand(
          KEY_ENTER_COMMAND,
          () => true,
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
