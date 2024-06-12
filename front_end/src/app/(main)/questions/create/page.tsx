/*"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form_field";
import Select from "@/components/ui/select";
import { QuestionType } from "@/types/question";

const ACCESS_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

const QUESTION_TYPE_OPTIONS = [
  { value: QuestionType.Binary, label: "Binary" },
  { value: QuestionType.MultipleChoice, label: "Multiple Choice" },
];

const QuestionForm: FC = () => {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    access: "public",
    questionType: QuestionType.Binary,
    question: "",
    title: "",
    backgroundInformation: "",
    resolutionCriteria: "",
    finePrint: "",
    closingDate: "",
    resolveDate: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
    // Process the data here or send it to an API
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="access"
          className="block text-sm font-medium text-gray-700"
        >
          {t("access")}
        </label>
        <Select
          id="access"
          name="access"
          value={formData.access}
          onChange={handleChange}
          options={ACCESS_OPTIONS}
        />
      </div>
      <div>
        <label
          htmlFor="questionType"
          className="block text-sm font-medium text-gray-700"
        >
          {t("questionType")}
        </label>
        <Select
          id="questionType"
          name="questionType"
          value={formData.questionType}
          onChange={handleChange}
          options={QUESTION_TYPE_OPTIONS}
        />
      </div>
      <div>
        <Input
          label={t("question")}
          type="text"
          name="question"
          value={formData.question}
          onChange={handleChange}
        />
      </div>
      <div>
        <Input
          label={t("title")}
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </div>
      <div>
        <Textarea
          label={t("backgroundInformation")}
          name="backgroundInformation"
          value={formData.backgroundInformation}
          onChange={handleChange}
        />
      </div>
      <div>
        <Textarea
          label={t("resolutionCriteria")}
          name="resolutionCriteria"
          value={formData.resolutionCriteria}
          onChange={handleChange}
        />
      </div>
      <div>
        <Textarea
          label={t("finePrint")}
          name="finePrint"
          value={formData.finePrint}
          onChange={handleChange}
        />
      </div>
      <div>
        <Input
          label={t("closingDate")}
          type="datetime-local"
          name="closingDate"
          value={formData.closingDate}
          onChange={handleChange}
        />
      </div>
      <div>
        <Input
          label={t("resolveDate")}
          type="datetime-local"
          name="resolveDate"
          value={formData.resolveDate}
          onChange={handleChange}
        />
      </div>
      <Button type="submit" variant="primary">
        {t("save")}
      </Button>
    </form>
  );
};

export default QuestionForm;
*/
