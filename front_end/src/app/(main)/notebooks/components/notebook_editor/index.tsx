"use client";

import "./editor.css";
import { useLocale } from "next-intl";
import React, { useEffect, useRef, useState } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import PostDefaultProject from "@/components/post_default_project";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import { NotebookPost } from "@/types/post";

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
  }, [postData, locale]);

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

  const defaultProject = postData.projects.default_project;
  return (
    <div>
      <div className="flex">
        <PostDefaultProject defaultProject={defaultProject} />
      </div>
      <div id={contentId} ref={contentRef}>
        <MarkdownEditor mode="read" markdown={markdown} withTwitterPreview />
      </div>
    </div>
  );
};

export default NotebookEditor;
