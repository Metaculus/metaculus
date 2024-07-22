import { useLexicalNodeRemove } from "@mdxeditor/editor";
import {
  DetailedHTMLProps,
  HTMLAttributes,
  KeyboardEventHandler,
  useCallback,
  useRef,
} from "react";

const useLexicalBackspaceNodeRemove = <T extends HTMLElement>(
  enabled: boolean
) => {
  const ref = useRef<T>(null);
  const deleteMathJax = useLexicalNodeRemove();

  const handleClick = useCallback(() => {
    if (!enabled) return;
    ref.current?.focus();
  }, [enabled]);

  const handleKeyDown: KeyboardEventHandler<T> = useCallback(
    (event) => {
      const shouldRemove = enabled && ref.current === document.activeElement;

      if (event.key === "Backspace" && shouldRemove) {
        setTimeout(() => {
          deleteMathJax();
        });
      }
    },
    [deleteMathJax, enabled]
  );

  const getReferenceProps = useCallback(() => {
    const props: DetailedHTMLProps<HTMLAttributes<T>, T> = {
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      tabIndex: -1,
    };

    return props;
  }, [handleClick, handleKeyDown]);

  return { ref, getReferenceProps };
};

export default useLexicalBackspaceNodeRemove;
