import Image from "next/image";
import React from "react";

import ServiceConfig from "../../serviceConfig";

type PartnerLogo = (typeof ServiceConfig.partnersLogos)[number];

const BULLETS = [
  "Schedule a demo",
  "Explore use-cases for your team",
  "Get help with pricing",
];

const ContactIntro: React.FC = () => {
  const partners = ServiceConfig.partnersLogos as PartnerLogo[];

  return (
    <aside className="flex min-w-0 max-w-[436px] flex-1 flex-col p-8">
      <h2 className="m-0 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-900-dark">
        Contact our partnership team
      </h2>

      <ul className="mt-8 flex list-none flex-col gap-3 p-0">
        {BULLETS.map((text) => (
          <li key={text} className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-gray-0 dark:bg-gray-900-dark dark:text-gray-0-dark"
            >
              ✓
            </span>
            <span className="text-base leading-5 text-gray-700 dark:text-gray-700-dark">
              {text}
            </span>
          </li>
        ))}
      </ul>

      <p className="m-0 mt-12 text-base leading-5 text-blue-700 dark:text-blue-700-dark">
        Leading companies partner with Metaculus
      </p>

      <div className="mt-4 grid w-max grid-cols-3 items-center gap-2.5">
        {partners.map((p) => (
          <a
            key={p.alt}
            href={p.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            aria-label={p.alt}
          >
            <div className="relative h-[20px] w-[80px]">
              <Image
                src={p.light}
                alt={p.alt}
                fill
                sizes="80px"
                className="object-contain opacity-90 dark:hidden"
              />
              <Image
                src={p.dark}
                alt={p.alt}
                fill
                sizes="80px"
                className="hidden object-contain opacity-90 dark:block"
              />
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
};

export default ContactIntro;
