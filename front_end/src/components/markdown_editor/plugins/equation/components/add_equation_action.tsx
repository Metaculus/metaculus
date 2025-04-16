import { faSquareRootVariable } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { FC, useState } from "react";

import Button from "@/components/ui/button";

import AddEquationModal from "./add_equation_modal";

const AddEquationAction: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        presentationType="icon"
        variant="text"
        onClick={() => setIsModalOpen(true)}
        className="h-7 w-7"
      >
        <FontAwesomeIcon icon={faSquareRootVariable} />
      </Button>
      <AddEquationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default AddEquationAction;
