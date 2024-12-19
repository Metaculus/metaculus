import React, { useEffect, useRef, PropsWithChildren } from "react";

type VisibilityObserverProps = {
  onVisibilityChange: (isVisible: boolean) => void;
};

const VisibilityObserver: React.FC<
  PropsWithChildren<VisibilityObserverProps>
> = ({ children, onVisibilityChange }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        onVisibilityChange(entry?.isIntersecting ?? false);
      },
      { threshold: 0.1 } // Adjust threshold as needed
    );

    const currentElement = wrapperRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [onVisibilityChange]);

  return <div ref={wrapperRef}>{children}</div>;
};

export default VisibilityObserver;
