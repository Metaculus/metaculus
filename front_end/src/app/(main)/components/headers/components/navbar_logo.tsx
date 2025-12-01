import Link from "next/link";
import { FC } from "react";

import { usePublicSettings } from "@/contexts/public_settings_context";

const NavbarLogo: FC = () => {
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();

  if (PUBLIC_MINIMAL_UI) {
    return null;
  }

  return (
    <Link
      href="/"
      className="inline-flex max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center bg-blue-800 text-center no-underline"
    >
      <h1 className="mx-[17px] my-0">
        <span>
          <svg
            width="14"
            height="27"
            viewBox="0 0 14 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.11212 27V8.50243L6.17541 27H7.74633L10.8096 8.50243V27H13.9515V0.804924H9.55289L6.96087 13.8436L4.36886 0.804924H0.0488281V27H3.11212Z"
              fill="white"
            />
          </svg>
        </span>
      </h1>
    </Link>
  );
};

export default NavbarLogo;
