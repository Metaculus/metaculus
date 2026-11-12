"use client";

import { useEffect } from "react";

const POINTER_MODE_CLASS = "wby-pointer-mode";
const MODIFIER_KEYS = new Set(["Shift", "Meta", "Control", "Alt"]);

// Focus rings are for keyboard use: a pointer press hides them on this page's
// controls, and any key other than a modifier brings them back.
export default function PointerFocusMode() {
  useEffect(() => {
    const root = document.documentElement;
    const onPointerDown = () => root.classList.add(POINTER_MODE_CLASS);
    const onKeyDown = (event: KeyboardEvent) => {
      if (!MODIFIER_KEYS.has(event.key)) {
        root.classList.remove(POINTER_MODE_CLASS);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      root.classList.remove(POINTER_MODE_CLASS);
    };
  }, []);

  return null;
}
