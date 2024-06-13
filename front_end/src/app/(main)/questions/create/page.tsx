"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";

import Button from "@/components/ui/button";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
import Select, { SelectOption } from "@/components/ui/select";

import { createQuestionPost } from "../actions";

const questionSchema = z.object({
  type: z
    .enum([
      "binary",
      "multiple_choice",
      "date",
      "numeric",
      "conditional",
      "group",
    ])
    .default("binary"),
  title: z.string().min(4).max(200),
  description: z.string().min(10),
  resolution: z.string().optional(),
  closed_at: z.date().optional(),
  resolved_at: z.date().optional(),
  max: z.number().optional(),
  min: z.number().optional(),
  zero_point: z.number().default(0),
  open_upper_bound: z.boolean().default(true),
  open_lower_bound: z.boolean().default(true),
  options: z.array(z.string()).default([]),
});

type QuestionFormData = z.infer<typeof questionSchema>;

const QuestionForm: React.FC = () => {
  const control = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
  });

  const type = control.watch("type", "binary");

  const submitQUestion = async (data: QuestionFormData) => {
    let post_data: {
      title: string;
      question?: QuestionFormData;
      conditional?: QuestionFormData;
      group?: QuestionFormData;
    } = {
      title: data["title"],
    };
    console.log("Data: ", data);
    if (
      ["binary", "multiple_choice", "date", "numeric"].includes(data["type"])
    ) {
      post_data["question"] = data;
    } else if ("conditional" == data["type"]) {
      // Step 1: Create the branched questions
      // Step 2: Create the conditional
    } else if ("group" == data["type"]) {
      // Step 1: Create all the questions in the groups
      // Step 2: Create the group itself
    }
    await createQuestionPost(post_data);
  };

  const [advanced, setAdvanced] = useState(false);
  const [questionType, setQuestionType] = useState("binary");

  const questionTypeSelect = {
    binary: "Binary",
    numeric: "Numeric",
    date: "Date",
    multiple_choice: "Multiple Choice",
    conditional: "Conditional",
  };
  return (
    <div className="flex flex-row justify-center">
      <form
        onSubmit={control.handleSubmit(submitQUestion, async (e) => {
          console.log("Error: ", e);
        })}
        className="text-light-100 text-m mb-8 mt-8 flex w-[540px] flex-col space-y-4 rounded-s border border-blue-800 bg-blue-900 p-8"
      >
        <span>Question Type</span>
        <Select
          {...control.register("type")}
          value={questionType}
          // @ts-ignore
          label={questionTypeSelect[questionType]}
          options={Object.keys(questionTypeSelect).map((key) => ({
            value: key,
            // @ts-ignore
            label: questionTypeSelect[key],
          }))}
          onChange={(val) => setQuestionType(val)}
        />
        <FormError
          errors={control.formState.errors}
          className="text-red-500-dark"
          {...control.register("type")}
        />

        <span>Title</span>
        <Input
          {...control.register("title")}
          errors={control.formState.errors.title}
        />
        <span>Description</span>
        <Textarea
          {...control.register("description")}
          errors={control.formState.errors.description}
          className="h-[120px] w-[400px]"
        />

        {advanced && (
          <>
            <span>Closing Date</span>
            <Input
              type="date"
              {...control.register("closed_at")}
              errors={control.formState.errors.closed_at}
            />

            <span>Resolving Date</span>
            <Input
              type="date"
              {...control.register("resolved_at")}
              errors={control.formState.errors.resolved_at}
            />
          </>
        )}

        {(questionType == "numeric" || questionType == "date") && (
          <>
            <span>Max</span>
            <Input
              type="number"
              {...control.register("max")}
              errors={control.formState.errors.max}
            />
            <span>Min</span>
            <Input
              type="number"
              {...control.register("min")}
              errors={control.formState.errors.min}
            />
            <span>Open Upper Bound</span>
            <Input
              type="checkbox"
              {...control.register("open_upper_bound")}
              errors={control.formState.errors.open_upper_bound}
            />

            <span>Open Lower Bound</span>
            <Input
              type="checkbox"
              {...control.register("open_lower_bound")}
              errors={control.formState.errors.open_lower_bound}
            />
          </>
        )}

        {advanced && (questionType == "numeric" || questionType == "date") && (
          <>
            <span>Zero Point</span>
            <Input
              type="number"
              {...control.register("zero_point")}
              errors={control.formState.errors.zero_point}
            />
          </>
        )}

        {advanced && (
          <>
            <span>Resolution</span>
            <Textarea
              {...control.register("resolution")}
              errors={control.formState.errors.resolution}
              className="h-[120px] w-[400px]"
            />
          </>
        )}

        <div className=""></div>
        <Button type="submit">Create Question</Button>
        <Button onClick={() => setAdvanced(!advanced)}>
          {advanced ? "Change to Simple Mode" : "Change to Advanced Mode"}
        </Button>
      </form>
    </div>
  );
};

export default QuestionForm;
