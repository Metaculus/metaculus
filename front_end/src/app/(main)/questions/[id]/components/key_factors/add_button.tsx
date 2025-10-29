import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { ElementType, FC, PropsWithChildren, useState } from "react";

import AddKeyFactorsModal from "@/app/(main)/questions/[id]/components/key_factors/add_modal";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

type Props = {
  onClick: (event: React.MouseEvent) => void;
  className?: string;
  as?: ElementType;
};

export const AddButton: FC<PropsWithChildren<Props>> = ({
  onClick,
  className,
  children,
  as,
}) => {
  return (
    <Button
      className={cn(
        "cursor-pointer gap-2 px-3 py-1 text-sm capitalize",
        className
      )}
      size="xs"
      variant="tertiary"
      as={as}
      onClick={(e) => onClick(e)}
    >
      <FontAwesomeIcon icon={faPlus} className="size-4 p-0" />
      {children}
    </Button>
  );
};

type AddKeyFactorsButtonProps = {
  className?: string;
  post: PostWithForecasts;
  onClick?: () => void;
  as?: ElementType;
};

export const AddKeyFactorsButton: FC<AddKeyFactorsButtonProps> = ({
  className,
  post,
  onClick,
  as,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setCurrentModal } = useModal();

  return (
    <>
      {user && (
        <AddKeyFactorsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          post={post}
          user={user}
        />
      )}
      <AddButton
        onClick={() => {
          if (!user) {
            setCurrentModal({ type: "signin" });
            return;
          }
          setIsModalOpen(true);

          onClick?.();
        }}
        className={className}
        as={as}
      >
        {t("addKeyFactor")}
      </AddButton>
    </>
  );
};
