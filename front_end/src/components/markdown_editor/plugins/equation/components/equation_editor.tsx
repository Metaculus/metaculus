import { FC, Ref, RefObject } from "react";
import { ChangeEvent, forwardRef } from "react";

import ResizableTextArea from "@/components/ui/resizable_text_area";

type BaseEquationEditorProps = {
  equation: string;
  inline: boolean;
  setEquation: (equation: string) => void;
};

function EquationEditor(
  { equation, setEquation, inline }: BaseEquationEditorProps,
  forwardedRef: Ref<HTMLInputElement | HTMLTextAreaElement>
): JSX.Element {
  const onChange = (event: ChangeEvent) => {
    setEquation((event.target as HTMLInputElement).value);
  };

  const Container = inline ? "span" : "div";
  return (
    <Container className="bg-gray-300 dark:bg-gray-300-dark">
      <DollarSign isInline={inline} type="start" />
      {inline ? (
        <input
          className="m-0 border-none bg-inherit p-0 text-purple-700 outline-0 dark:text-purple-700-dark"
          value={equation}
          onChange={onChange}
          autoFocus={true}
          ref={forwardedRef as RefObject<HTMLInputElement>}
        />
      ) : (
        <ResizableTextArea
          className="m-0 w-full border-none bg-inherit p-0 text-purple-700 outline-0 dark:text-purple-700-dark"
          value={equation}
          onChange={onChange}
          ref={forwardedRef as RefObject<HTMLTextAreaElement>}
        />
      )}
      <DollarSign isInline={inline} type="end" />
    </Container>
  );
}

const DollarSign: FC<{ isInline: boolean; type: "start" | "end" }> = ({
  isInline,
  type,
}) => {
  let label = "$";
  if (!isInline) {
    switch (type) {
      case "start":
        label = "$$\n";
        break;
      case "end":
        label = "\n$$";
        break;
    }
  }

  return <span className="text-gray-500 dark:text-gray-500-dark">{label}</span>;
};

export default forwardRef(EquationEditor);
