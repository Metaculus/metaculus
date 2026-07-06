import { useEffect, useRef, useState } from "react";

const useSectionHeadings = (sectionId: string) => {
  const [headings, setHeadings] = useState<HeadingInfo[]>([]);
  const lastKeyRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const contentSection = document.getElementById(sectionId);
    if (!contentSection) return;

    const updateHeadings = () => {
      const els = Array.from(
        contentSection.querySelectorAll("h1, h2, h3")
      ) as HTMLHeadingElement[];

      const headingCountMap: Record<string, number> = {};

      const next: HeadingInfo[] = els.map((heading) => {
        const base = generateSlug(heading.textContent ?? "");
        headingCountMap[base] = (headingCountMap[base] || 0) + 1;
        const count = headingCountMap[base];
        const id = count > 1 ? `${base}-${count}` : base;

        if (heading.id !== id) heading.id = id;

        return {
          id,
          tagName: heading.tagName as HeadingInfo["tagName"],
          textContent: (heading.textContent ?? "").trim(),
        };
      });

      const key = buildKey(next);
      if (key === lastKeyRef.current) return;

      lastKeyRef.current = key;
      setHeadings(next);
    };

    const scheduleUpdate = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateHeadings();
      });
    };

    updateHeadings();

    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some((m) => {
        for (const n of Array.from(m.addedNodes))
          if (nodeCouldAffectHeadings(n)) return true;
        for (const n of Array.from(m.removedNodes))
          if (nodeCouldAffectHeadings(n)) return true;
        return false;
      });

      if (!relevant) return;
      scheduleUpdate();
    });

    observer.observe(contentSection, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [sectionId]);

  return headings;
};

type HeadingInfo = {
  id: string;
  textContent: string;
  tagName: "H1" | "H2" | "H3";
};

function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\//g, "-")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildKey(items: HeadingInfo[]) {
  return items.map((h) => `${h.tagName}|${h.id}|${h.textContent}`).join("##");
}

function nodeCouldAffectHeadings(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = node as Element;
  return el.matches?.("h1, h2, h3") || !!el.querySelector?.("h1, h2, h3");
}

export default useSectionHeadings;
