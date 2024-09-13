"use client";

import { useTranslations } from "next-intl";
import React from "react";

import ProjectPicker from "@/app/(main)/questions/components/project_picker";
import { InputContainer } from "@/components/ui/input_container";

const ProjectPickerInput: React.FC<
  React.ComponentProps<typeof ProjectPicker>
> = (props) => {
  const t = useTranslations();
  const { tournaments } = props;

  // Show selector only if user has at least 1 project
  // With admin/curator permissions
  if (tournaments.length) {
    return (
      <InputContainer labelText={t("projects")}>
        <ProjectPicker {...props} />
      </InputContainer>
    );
  }
};

export default ProjectPickerInput;
