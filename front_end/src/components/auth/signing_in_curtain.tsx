"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useState } from "react";

import SigningInPanel from "@/components/auth/signing_in_panel";
import { EMAIL_LINK_CONFIRMED_EVENT } from "@/utils/email_link_confirmation";

const FADE_MS = 300;

// Layout effects do nothing during SSR and React says so loudly; this component
// renders null there anyway, so fall back to the ordinary effect.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Covers the destination page on arrival from a magic link, then dissolves.
 *
 * The verify page holds its loading panel until this route has fully rendered,
 * but it unmounts the instant the swap happens, so the fade has to be done from
 * this side. Rendering the identical panel makes the handover invisible; only
 * the fade is seen.
 */
export default function SigningInCurtain() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [covering, setCovering] = useState(false);

  // Armed in an effect rather than during render, so nothing is server-rendered:
  // a full-viewport overlay in the streamed HTML stays put covering the page if
  // React does not adopt that boundary. Before paint, so the curtain arrives in
  // the same frame as the page underneath it. Reading the param each time it
  // changes rather than once at mount keeps this working whether or not the
  // layout remounted, and the confirmation toast strips it moments later.
  useIsomorphicLayoutEffect(() => {
    if (searchParams.get("event") === EMAIL_LINK_CONFIRMED_EVENT) {
      setCovering(true);
    }
  }, [searchParams]);

  // A stuck curtain hides the whole page, so never depend solely on the
  // animation ending. Whichever fires first wins; a backgrounded tab pauses the
  // animation and still gets cleared, just without a fade nobody was watching.
  useEffect(() => {
    if (!covering) return;
    const timer = setTimeout(() => setCovering(false), FADE_MS * 4);
    return () => clearTimeout(timer);
  }, [covering]);

  if (!covering) return null;

  return (
    <SigningInPanel
      message={t("emailLinkSigningIn")}
      onAnimationEnd={() => setCovering(false)}
      className="pointer-events-none fixed inset-0 z-[300] animate-fade-out"
    />
  );
}
