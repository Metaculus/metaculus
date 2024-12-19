import { isNil } from "lodash";
import { useEffect, useState } from "react";

const useSectionHeadings = (sectionId: string) => {
  const [headings, setHeadings] = useState<HTMLHeadingElement[]>([]);

  useEffect(() => {
    const contentSection = document.getElementById(sectionId);
    if (!contentSection) {
      return;
    }

    const updateHeadings = () => {
      const contentHeadings: HTMLHeadingElement[] = Array.from(
        contentSection.querySelectorAll("h1, h2, h3")
      );

      const headingCountMap: Record<string, number> = {};

      const updatedHeadings = contentHeadings.map((heading) => {
        const id = generateSlug(heading.textContent ?? "");
        headingCountMap[id] = (headingCountMap[id] || 0) + 1;

        const headingCount = headingCountMap[id];
        if (!isNil(headingCount) && headingCount > 1) {
          heading.id = `${id}-${headingCountMap[id]}`;
        } else {
          heading.id = id;
        }

        return heading;
      });

      setHeadings(updatedHeadings);
    };

    updateHeadings();

    const observer = new MutationObserver(() => {
      updateHeadings();
    });

    observer.observe(contentSection, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [sectionId]);

  return headings;
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

export default useSectionHeadings;
