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
  const anchorClickHandlersRef = useRef<Map<Element, EventListener>>(new Map());
  const prevIdTracker = useRef<string | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafIdRef = useRef<number | null>(null);

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
    const anchorClickHandlers = anchorClickHandlersRef.current;
    const anchorElements = selfRef.current
      ? Array.from(
          selfRef.current.querySelectorAll(`[data-${dataAttribute}-anchor]`)
        )
      : [];
    anchorElementsRef.current = anchorElements;

    anchorElements.forEach((item) => {
      const clickHandler =
        anchorClickHandlers.get(item) ?? scrollTo(item as HTMLElement);
      anchorClickHandlers.set(item, clickHandler);
      item.addEventListener("click", clickHandler);
    });

    // Coalesce scroll events to one run per animation frame — every call to
    // handleScroll iterates every tracked section and reads layout, so raw
    // scroll-event cadence would thrash on long pages.
    const onScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        handleScroll();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Check if there's a hash in the URL and scroll to the corresponding section
    scrollTimeoutRef.current = setTimeout(() => {
      scrollTimeoutRef.current = null;
      scrollToHashSection();
      // Wait for scroll to settle, then update nav highlighting
      settleTimeoutRef.current = setTimeout(() => {
        settleTimeoutRef.current = null;
        handleScroll();
      }, 100);
    }, 100); // Adding a slight delay to ensure content is fully rendered

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      anchorElements.forEach((item) => {
        const clickHandler = anchorClickHandlers.get(item);
        if (clickHandler) {
          item.removeEventListener("click", clickHandler);
        }
      });
      anchorClickHandlers.clear();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }
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
