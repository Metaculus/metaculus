import { subMonths, isBefore } from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";

import RichText from "@/components/rich_text";
import { CurrentUser } from "@/types/users";

export function validateComment(
  comment: string,
  user: CurrentUser,
  t: ReturnType<typeof useTranslations>
) {
  const isNewUser = isBefore(
    subMonths(new Date(), 1),
    new Date(user.date_joined)
  );

  if (isNewUser && comment.length < 30) {
    return (
      <RichText>
        {(tags) =>
          t.rich("commentTooShort", {
            ...tags,
            info: (chunks) => <p className="mt-2 text-sm">{chunks}</p>,
            link: (chunks) => <Link href="/help/guidelines/">{chunks}</Link>,
          })
        }
      </RichText>
    );
  }
  return null;
}
