"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import Button from "@/components/ui/button";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
import Select, { SelectOption } from "@/components/ui/select";

import { createQuestionPost } from "../actions";

const questionSchema = z.object({
  type: z.string().optional(), // Should be required but select doesn't register properly
  title: z.string().min(4).max(200),
  description: z.string().optional(), // Should be required but textareas don't register properly
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
  });

  const submitQUestion = async (data: QuestionFormData) => {
    data["type"] = questionType;
    let post_data: {
      title: string;
      question?: QuestionFormData;
      conditional?: QuestionFormData;
      group?: QuestionFormData;
    } = {
      title: data["title"],
    };
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

  return (
    <div className="flex flex-row justify-center">
      <form
        onSubmit={handleSubmit(submitQUestion, async (e) => {
          console.log("Error: ", e);
        })}
        className="text-light-100 text-m mb-8 mt-8 flex w-[540px] flex-col space-y-4 rounded-s border border-blue-800 bg-blue-900 p-8"
      >
        <span>Question Type</span>
        <Select
          {...register("type")}
          value="binary"
          label="Binary"
          options={[
            { value: "binary", label: "Binary" },
            { value: "numeric", label: "Numeric" },
            { value: "date", label: "Date" },
            { value: "multiple_choice", label: "Multiple Choice" },
            { value: "conditional", label: "Conditional" },
          ]}
          onChange={(val) => setQuestionType(val)}
        />
        <FormError
          errors={errors}
          className="text-red-500-dark"
          {...register("type")}
        />

        <span>Title</span>
        <Input {...register("title")} errors={errors.title} />

        <span>Description</span>
        <Textarea
          {...register("description")}
          errors={errors.description}
          className="h-[120px] w-[400px]"
          type="text"
        />

        {advanced && (
          <>
            <span>Closing Date</span>
            <Input
              type="date"
              {...register("closed_at")}
              errors={errors.closed_at}
            />

            <span>Resolving Date</span>
            <Input
              type="date"
              {...register("resolved_at")}
              errors={errors.resolved_at}
            />
          </>
        )}

        {(questionType == "numeric" || questionType == "date") && (
          <>
            <span>Max</span>
            <Input type="number" {...register("max")} errors={errors.max} />
            <span>Min</span>
            <Input type="number" {...register("min")} errors={errors.min} />
            <span>Open Upper Bound</span>
            <Input
              type="checkbox"
              {...register("open_upper_bound")}
              errors={errors.open_upper_bound}
            />

            <span>Open Lower Bound</span>
            <Input
              type="checkbox"
              {...register("open_lower_bound")}
              errors={errors.open_lower_bound}
            />
          </>
        )}

        {advanced && (questionType == "numeric" || questionType == "date") && (
          <>
            <span>Zero Point</span>
            <Input
              type="number"
              {...register("zero_point")}
              errors={errors.zero_point}
            />
          </>
        )}

        {advanced && (
          <>
            <span>Resolution</span>
            <Textarea
              {...register("resolution")}
              errors={errors.resolution}
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
