import { viewMode$, useCellValue } from "@mdxeditor/editor";
import Link from "next/link";
import { useTranslations } from "next-intl";

export const SourceModeTitle = () => {
  const t = useTranslations();
  const viewMode = useCellValue(viewMode$);

  if (viewMode !== "source") {
    return null;
  }

  return (
    <div className="flex items-center text-sm text-gray-500 dark:!text-gray-500-dark">
      <span className="text-gray-600 dark:!text-gray-800-dark">
        {t("sourceMode")}
      </span>
      <span className="mx-0.5 ">•</span>{" "}
      <Link
        href="/help/markdown/"
        className="lowercase !text-gray-700 no-underline dark:!text-gray-500-dark"
        target="_blank"
        rel="noopener noreferrer"
      >
        (
        <span className="underline dark:text-gray-800-dark">
          {t("markdownHelp")}
        </span>
        )
      </Link>
    </div>
  );
};
