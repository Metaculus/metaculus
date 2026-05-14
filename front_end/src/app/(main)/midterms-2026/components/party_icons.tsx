import { FC, SVGProps } from "react";

/**
 * Inline donkey/elephant SVGs so the fill picks up via `color` /
 * `currentColor` and tints to the active party color. next/image can't do
 * that with external SVGs.
 */

export const ElephantIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M52 18c-2.2 0-4 1.4-4.7 3.3-2-2.7-5.1-4.5-8.7-4.8-1-1.3-2.4-2.4-4.1-3-3.2-1.2-7-.7-9.6 1.5l-1-1c-.6-.5-1.5-.5-2 0-.6.6-.6 1.4 0 2l1 1.1c-1 1.3-1.6 2.8-1.9 4.3-3.6.4-6.7 2.2-8.7 4.9-.7-1.9-2.5-3.3-4.7-3.3C5.4 23 4 24.4 4 26v3c0 1.2 1 2 2 2h2v15c0 1.7 1.4 3 3 3h4c1.7 0 3-1.3 3-3v-5h14v5c0 1.7 1.3 3 3 3h4c1.6 0 3-1.3 3-3V35c2.5-1.4 4-4 4-7 0-2.4-1-4.6-2.7-6.2.5-.9 1.3-1.5 2.4-1.7v3.3c-.7.3-1.2 1-1.2 1.8 0 1.1.9 2 2 2s2-.9 2-2c0-.8-.5-1.5-1.2-1.8V18zM18 24c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
  </svg>
);

export const DonkeyIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M58 21c0-1.1-.9-2-2-2h-2v-4c0-.8-.5-1.5-1.2-1.8L48 11.2V8c0-1.1-.9-2-2-2s-2 .9-2 2v2l-4-1.7c-1-.5-2.2 0-2.7 1-.4 1 0 2.2 1 2.7L44 14.2V19h-4l-2.5-3.3a3 3 0 0 0-2.4-1.2H20c-1.7 0-3 1.3-3 3v2.3c-1.7.6-3 2.3-3 4.2v3c0 .5.2 1 .6 1.4l3.4 3.4V46c0 1.7 1.3 3 3 3h4c1.7 0 3-1.3 3-3v-6h7v6c0 1.7 1.4 3 3 3h4c1.7 0 3-1.3 3-3V31c2.9-.5 5-2.9 5-5.8V22h2c1.1 0 2-.9 2-2zM23 27c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
  </svg>
);
