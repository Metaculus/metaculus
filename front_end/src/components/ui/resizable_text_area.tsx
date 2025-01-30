import {
  forwardRef,
  InputHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { mergeRefs } from "react-merge-refs";

const ResizableTextArea = forwardRef<
  HTMLTextAreaElement,
  InputHTMLAttributes<HTMLTextAreaElement>
>((props, forwardedRef) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    if (!textAreaRef.current) return;

    textAreaRef.current.style.height = "0px";
    const scrollHeight = textAreaRef.current.scrollHeight;

    textAreaRef.current.style.height = scrollHeight + "px";
  }, []);

  useEffect(() => {
    resize();
  }, [resize]);

  return (
    <textarea
      ref={mergeRefs([textAreaRef, forwardedRef])}
      {...props}
      onChange={(e) => {
        props.onChange?.(e);
        resize();
      }}
    />
  );
});
ResizableTextArea.displayName = "AutoTextArea";

export default ResizableTextArea;
