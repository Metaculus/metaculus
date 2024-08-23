import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Modal, { ModalProps } from "./Modal";

interface ModalWithArrowsProps extends ModalProps {
  onPrevious: () => void;
  previousDisabled?: boolean;
  onNext: () => void;
  nextDisabled?: boolean;
}

export default function ModalWithArrows({
  onPrevious,
  previousDisabled,
  onNext,
  nextDisabled,
  ...rest
}: ModalWithArrowsProps) {
  return (
    <Modal
      {...rest}
      beforePanel={
        <button
          className="text-metac-gray-0 self-center px-1 py-4 text-5xl opacity-50 hover:opacity-95 disabled:opacity-25 xs:px-3 md:mr-4"
          aria-label="Next"
          onClick={onPrevious}
          disabled={previousDisabled}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      }
      afterPanel={
        <button
          className="text-metac-gray-0 self-center px-1 py-4 text-5xl opacity-50 hover:opacity-95 disabled:opacity-25 xs:px-3 md:ml-4"
          aria-label="Next"
          onClick={onNext}
          disabled={nextDisabled}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      }
    />
  );
}
