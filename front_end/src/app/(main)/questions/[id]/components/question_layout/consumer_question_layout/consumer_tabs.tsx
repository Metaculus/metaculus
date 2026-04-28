"use client";

import { PropsWithChildren } from "react";

import { Tabs } from "@/components/ui/tabs/index";

import { useQuestionLayout } from "../question_layout_context";

const ConsumerTabs: React.FC<PropsWithChildren> = ({ children }) => {
  const { activeTab, setActiveTab } = useQuestionLayout();

  return (
    <Tabs
      defaultValue="comments"
      className="-mb-5"
      value={activeTab}
      onChange={setActiveTab}
    >
      {children}
    </Tabs>
  );
};

export default ConsumerTabs;
