"use client";

import { type ReactNode, useCallback, useEffect, useRef } from "react";

type ScrollspyProps = {
  children: ReactNode;
  onUpdate?: (id: string) => void;
  offset?: number;
  smooth?: boolean;
  className?: string;
  dataAttribute?: string;
  history?: boolean;
  throttleTime?: number;
  style?: React.CSSProperties;
  /** Scroll the active anchor into view within its horizontal scroll container */
  scrollActiveIntoView?: boolean;
};

export function Scrollspy({
  children,
  onUpdate,
  className,
  style = {},
  offset = 0,
  smooth = true,
  dataAttribute = "scrollspy",
  history = true,
  scrollActiveIntoView = false,
}: ScrollspyProps) {
  const selfRef = useRef<HTMLDivElement | null>(null);
  const anchorElementsRef = useRef<Element[] | null>(null);
  const prevIdTracker = useRef<string | null>(null);

  // Sets active nav, hash, prevIdTracker, and calls onUpdate
  const setActiveSection = useCallback(
    (sectionId: string | null, force = false) => {
      if (!sectionId) return;
      let activeElement: Element | null = null;
      anchorElementsRef.current?.forEach((item) => {
        const id = item.getAttribute(`data-${dataAttribute}-anchor`);
        if (id === sectionId) {
          item.setAttribute("data-active", "true");
          activeElement = item;
        } else {
          item.removeAttribute("data-active");
        }
      });

      // Scroll active element into view within horizontal scroll container
      if (scrollActiveIntoView && activeElement) {
        (activeElement as HTMLElement).scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "nearest",
          inline: "nearest",
        });
      }

      if (onUpdate) onUpdate(sectionId);
      if (history && (force || prevIdTracker.current !== sectionId)) {
        window.history.replaceState({}, "", `#${sectionId}`);
      }
      prevIdTracker.current = sectionId;
    },
    [
      anchorElementsRef,
      dataAttribute,
      history,
      onUpdate,
      scrollActiveIntoView,
      smooth,
    ]
  );

  const handleScroll = useCallback(() => {
    if (!anchorElementsRef.current || anchorElementsRef.current.length === 0)
      return;

    const viewportHeight = window.innerHeight;

    // Calculate visible percentage for each section
    let activeIdx = 0;
    let maxVisiblePercentage = 0;

    anchorElementsRef.current.forEach((anchor, idx) => {
      const sectionId = anchor.getAttribute(`data-${dataAttribute}-anchor`);
      if (!sectionId) return;
      const sectionElement = document.getElementById(sectionId);
      if (!sectionElement) return;

      let customOffset = offset;
      const dataOffset = anchor.getAttribute(`data-${dataAttribute}-offset`);
      if (dataOffset) customOffset = Number.parseInt(dataOffset, 10);

      const rect = sectionElement.getBoundingClientRect();
      const elementHeight = rect.height;

      // Calculate the visible portion of the element within the viewport
      // Account for the offset (typically used for fixed headers)
      const adjustedViewportTop = customOffset;
      const adjustedViewportBottom = viewportHeight;

      // Calculate intersection: how much of the element is visible
      // rect.top is relative to viewport top, rect.bottom is relative to viewport top
      const visibleTop = Math.max(rect.top, adjustedViewportTop);
      const visibleBottom = Math.min(rect.bottom, adjustedViewportBottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      // Calculate percentage of element that is visible
      const visiblePercentage =
        elementHeight > 0 ? (visibleHeight / elementHeight) * 100 : 0;

      // Select the section with the highest visible percentage
      if (visiblePercentage > maxVisiblePercentage) {
        maxVisiblePercentage = visiblePercentage;
        activeIdx = idx;
      }
    });

    // If at bottom, force last anchor
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    if (scrollTop + clientHeight >= scrollHeight - 2) {
      activeIdx = anchorElementsRef.current.length - 1;
    }

    // Set only one anchor active and sync the URL hash
    const activeAnchor = anchorElementsRef.current[activeIdx];
    const sectionId =
      activeAnchor?.getAttribute(`data-${dataAttribute}-anchor`) || null;
    setActiveSection(sectionId);
    // Remove data-active from all others
    anchorElementsRef.current.forEach((item, idx) => {
      if (idx !== activeIdx) {
        item.removeAttribute("data-active");
      }
    });
  }, [anchorElementsRef, dataAttribute, offset, setActiveSection]);

  const scrollTo = useCallback(
    (anchorElement: HTMLElement) => (event?: Event) => {
      if (event) event.preventDefault();
      const sectionId =
        anchorElement
          .getAttribute(`data-${dataAttribute}-anchor`)
          ?.replace("#", "") || null;
      if (!sectionId) return;
      const sectionElement = document.getElementById(sectionId);
      if (!sectionElement) return;

      let customOffset = offset;
      const dataOffset = anchorElement.getAttribute(
        `data-${dataAttribute}-offset`
      );
      if (dataOffset) {
        customOffset = Number.parseInt(dataOffset, 10);
      }

      const scrollTop = sectionElement.offsetTop - customOffset;

      window.scrollTo({
        top: scrollTop,
        left: 0,
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [dataAttribute, offset, smooth]
  );

  // Scroll to the section if the ID is present in the URL hash
  const scrollToHashSection = useCallback(() => {
    const hash = CSS.escape(window.location.hash.replace("#", ""));

    if (hash) {
      const targetElement = document.querySelector(
        `[data-${dataAttribute}-anchor="${hash}"]`
      ) as HTMLElement;
      if (targetElement) {
        scrollTo(targetElement)();
      }
    }
  }, [dataAttribute, scrollTo]);

  useEffect(() => {
    // Query elements and store them in the ref, avoiding unnecessary re-renders
    if (selfRef.current) {
      anchorElementsRef.current = Array.from(
        selfRef.current.querySelectorAll(`[data-${dataAttribute}-anchor]`)
      );
    }

    anchorElementsRef.current?.forEach((item) => {
      item.addEventListener("click", scrollTo(item as HTMLElement));
    });

    // Attach the scroll event to the correct scrollable element
    window.addEventListener("scroll", handleScroll);

    // Check if there's a hash in the URL and scroll to the corresponding section
    setTimeout(() => {
      scrollToHashSection();
      // Wait for scroll to settle, then update nav highlighting
      setTimeout(() => {
        handleScroll();
      }, 100);
    }, 100); // Adding a slight delay to ensure content is fully rendered

    return () => {
      window.removeEventListener("scroll", handleScroll);
      anchorElementsRef.current?.forEach((item) => {
        item.removeEventListener("click", scrollTo(item as HTMLElement));
      });
    };
  }, [selfRef, handleScroll, dataAttribute, scrollTo, scrollToHashSection]);

  return (
    <div
      data-slot="scrollspy"
      className={className}
      ref={selfRef}
      style={style}
    >
      {children}
    </div>
  );
}
