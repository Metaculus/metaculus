"use client";

import "./editor.css";
import { useLocale } from "next-intl";
import React, { useEffect, useRef, useState } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import Chip from "@/components/ui/chip";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import { NotebookPost } from "@/types/post";
import { TaxonomyProjectType } from "@/types/projects";
import { getProjectLink } from "@/utils/navigation";

interface NotebookEditorProps {
  postData: NotebookPost;
  contentId?: string;
}

const NotebookEditor: React.FC<NotebookEditorProps> = ({
  postData,
  contentId,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const [markdown] = useState(postData.notebook.markdown);

  const { setBannerIsVisible } = useContentTranslatedBannerContext();
  const locale = useLocale();

  useEffect(() => {
    if (postData.is_current_content_translated) {
      setBannerIsVisible(true);
    }
  }, [postData, locale, setBannerIsVisible]);

  // Handle hash anchor scrolling after content is rendered
  useEffect(() => {
    if (window.location.hash && contentRef.current) {
      const targetHash = window.location.hash;

      const scrollToHash = () => {
        setTimeout(() => {
          const element = document.querySelector(targetHash);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 1500);
      };

      const observer = new MutationObserver((mutations) => {
        // Check if any mutations added new elements
        const hasNewElements = mutations.some(
          (mutation) =>
            mutation.type === "childList" && mutation.addedNodes.length > 0
        );

        if (hasNewElements) {
          scrollToHash();
          observer.disconnect();
        }
      });

      // Start observing the markdown change container
      // Assuming it finishes rendering when it's changed
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
      }, 10000);

      return () => {
        observer.disconnect();
        clearTimeout(timeoutId);
      };
    }
  }, [markdown]);

  const defaultProject = postData.projects?.default_project;
  const otherProjects = [
    ...(postData.projects?.index ?? []),
    ...(postData.projects?.tournament ?? []),
    ...(postData.projects?.question_series ?? []),
    ...(postData.projects?.community ?? []),
    ...(postData.projects?.category ?? []),
    ...(postData.projects?.leaderboard_tag ?? []),
  ].filter((p) => defaultProject && p.id !== defaultProject.id);

  const allProjects = defaultProject
    ? [defaultProject, ...otherProjects]
    : otherProjects;

  const getChipText = (name: string, type?: string) =>
    type === "leaderboard_tag" ? `🏆 ${name}` : name;

  return (
    <div>
      {allProjects.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {allProjects.map((element) => (
            <Chip
              size="xs"
              color={
                Object.values(TaxonomyProjectType).includes(
                  element.type as TaxonomyProjectType
                )
                  ? "olive"
                  : "orange"
              }
              key={element.id}
              href={getProjectLink(element)}
            >
              {getChipText(element.name, element.type)}
            </Chip>
          ))}
        </div>
      )}
      <div id={contentId} ref={contentRef}>
        <MarkdownEditor mode="read" markdown={markdown} withTwitterPreview />
      </div>
    </div>
  );
};

export default NotebookEditor;
