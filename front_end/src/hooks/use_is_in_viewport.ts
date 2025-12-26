import { useEffect, useState } from "react";

export function useIsInViewport(el: HTMLElement | null) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.01 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [el]);

  return inView;
}
