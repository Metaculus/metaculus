import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  Separator,
  UndoRedo,
} from "@mdxeditor/editor";
import { useState } from "react";

import cn from "@/utils/cn";

import { EmbedQuestionAction } from "./embedded_question";
import AddEquationAction from "./plugins/equation/components/add_equation_action";
import { SourceModeTitle } from "./source_mode_title";
import Button from "../ui/button";

const EditorToolbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <SourceModeTitle />
      <DiffSourceToggleWrapper options={["rich-text", "source"]}>
        <UndoRedo />
        <Separator />
        <BlockTypeSelect />
        <div className="hidden @[440px]:flex">
          <BoldItalicUnderlineToggles />
        </div>
        <div className="hidden @[580px]:flex">
          <Separator />
          <CreateLink />
          <InsertImage />
          <InsertThematicBreak />
          <InsertTable />
        </div>
        <Button
          variant="tertiary"
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-7 w-7 rounded border-none bg-transparent hover:bg-gray-0 @[695px]:hidden dark:bg-transparent dark:hover:bg-gray-0-dark"
        >
          <FontAwesomeIcon
            icon={faCaretDown}
            className={cn("block md:!hidden", {
              "rotate-180": isOpen,
            })}
          />
        </Button>
        {/* Dropdown items */}
        <div
          className={cn("hidden @[695px]:!flex", {
            hidden: !isOpen,
            "ml-2 flex min-w-[50%] max-w-full flex-1 flex-wrap gap-y-2 @[695px]:min-w-min":
              isOpen,
          })}
        >
          <div className="flex min-[485px]:hidden">
            <BoldItalicUnderlineToggles />
            <Separator />
          </div>
          <div className="flex">
            <div className="flex @[580px]:hidden">
              <CreateLink />
              <InsertImage />
              <InsertThematicBreak />
              <InsertTable />
            </div>
            <AddEquationAction />
            <Separator />
          </div>
          <EmbedQuestionAction />
        </div>
      </DiffSourceToggleWrapper>
    </>
  );
};

export default EditorToolbar;
