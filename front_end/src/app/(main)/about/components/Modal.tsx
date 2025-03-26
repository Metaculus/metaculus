import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { JSX } from "react";

import cn from "@/utils/cn";

import IconButton from "./IconButton";

interface ModalPanelProps extends React.PropsWithChildren {
  className?: string;
  title?: string;
  hideClose?: boolean;
  onClose: () => void;
  beforePanel?: JSX.Element;
  afterPanel?: JSX.Element;
}

function ModalPanel({
  children,
  className,
  title,
  hideClose,
  onClose,
  beforePanel,
  afterPanel,
}: ModalPanelProps) {
  return (
    <DialogPanel className={cn("flex max-h-full", className || "max-w-full")}>
      {beforePanel}
      <div className="relative max-h-full w-full rounded bg-white text-blue-900 dark:bg-gray-900 dark:text-white">
        {!hideClose && (
          <IconButton
            variant="text"
            size="xl"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-0 top-0"
          >
            <FontAwesomeIcon icon={faXmark} />
          </IconButton>
        )}
        <div className="max-h-full overflow-auto p-7">
          {title ? (
            <DialogTitle
              className={cn("mb-4 mt-0 text-blue-900 dark:text-blue-900-dark", {
                "mr-3": !hideClose,
              })}
            >
              {title}
            </DialogTitle>
          ) : null}
          {children}
        </div>
      </div>
      {afterPanel}
    </DialogPanel>
  );
}

export interface ModalProps extends ModalPanelProps {
  open: boolean;
}

export default function Modal({ onClose, open, ...props }: ModalProps) {
  return (
    <Dialog
      className="fixed inset-0 z-50 flex items-center justify-center before:absolute before:size-full before:bg-blue-900 before:opacity-50 before:content-[''] dark:before:bg-black"
      open={open}
      onClose={onClose}
    >
      <ModalPanel onClose={onClose} {...props} />
    </Dialog>
  );
}
