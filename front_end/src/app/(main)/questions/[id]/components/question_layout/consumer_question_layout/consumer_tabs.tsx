"use client";

import { PropsWithChildren } from "react";

import { Tabs } from "@/components/ui/tabs/index";

import { useQuestionLayout } from "../question_layout_context";

const ConsumerTabs: React.FC<PropsWithChildren> = ({ children }) => {
  const { mobileActiveTab, setMobileActiveTab } = useQuestionLayout();

  return (
    <Tabs
      defaultValue="comments"
      className="-mb-5"
      value={mobileActiveTab}
      onChange={setMobileActiveTab}
    >
      {children}
    </Tabs>
  );
};

export default ConsumerTabs;
