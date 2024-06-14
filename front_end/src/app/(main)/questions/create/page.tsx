"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";

import Button from "@/components/ui/button";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
import Select, { SelectOption } from "@/components/ui/select";

import { createQuestionPost } from "../actions";

const baseQuestionSchema = z.object({
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
});

const binaryQuestionSchema = baseQuestionSchema;

const continuousQuestionSchema = baseQuestionSchema.merge(
  z.object({
    zero_point: z.number().default(0),
    open_upper_bound: z.boolean().default(true),
    open_lower_bound: z.boolean().default(true),
  })
);

const numericQuestionSchema = continuousQuestionSchema.merge(
  z.object({
    max: z.number().optional(),
    min: z.number().optional(),
  })
);

const dateQuestionSchema = continuousQuestionSchema.merge(
  z.object({
    max: z.date().optional(),
    min: z.date().optional(),
  })
);

const multipleChoiceQuestionSchema = baseQuestionSchema.merge(
  z.object({
    options: z.array(z.string()).min(1),
  })
);

const conditionalQuestionSchema = baseQuestionSchema.merge(
  z.object({
    condition: z.number(),
    condition_child: z.number(),
  })
);

type BinaryQuestionSchema = z.infer<typeof binaryQuestionSchema>;
type NumericQuestionSchema = z.infer<typeof numericQuestionSchema>;
type MultipleChoiceQuestionSchema = z.infer<
  typeof multipleChoiceQuestionSchema
>;
type ConditionalQuestionSchema = z.infer<typeof conditionalQuestionSchema>;
type DateQuestionSchema = z.infer<typeof dateQuestionSchema>;

const QuestionForm: React.FC = () => {
  const submitQUestion = async (data: any) => {
    let post_data: {
      title: string;
      question?: any;
      conditional?: any;
      group?: any;
    } = {
      title: data["title"],
    };
    console.log("Data: ", data);
    if (
      ["binary", "multiple_choice", "date", "numeric"].includes(data["type"])
    ) {
      post_data["question"] = data;
    } else if ("conditional" == data["type"]) {
      post_data["conditional"] = data;
    } else if ("group" == data["type"]) {
      post_data["group"] = data;
    }
    await createQuestionPost(post_data);
  };

  const [advanced, setAdvanced] = useState(false);
  const [questionType, setQuestionType] = useState("binary");

  const getFormSchema = (type: string) => {
    switch (type) {
      case "binary":
        return binaryQuestionSchema;
      case "numeric":
        return numericQuestionSchema;
      case "date":
        return dateQuestionSchema;
      case "multiple_choice":
        return multipleChoiceQuestionSchema;
      case "conditional":
        return conditionalQuestionSchema;
      default:
        return binaryQuestionSchema;
    }
  };

  const control = useForm({
    // @ts-ignore
    resolver: zodResolver(getFormSchema(questionType)),
  });

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
          options={Object.keys(questionTypeSelect).map((key) => {
            return {
              value: key,
              // @ts-ignore
              label: questionTypeSelect[key],
            };
          })}
          onChange={(val) => {
            control.setValue("type", questionType);
            setQuestionType(val);
          }}
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

        {questionType == "numeric" && (
          <>
            <span>Max</span>
            <Input
              type="number"
              {...control.register("max", {
                setValueAs: (value: string) => Number(value),
              })}
              errors={control.formState.errors.max}
            />
            <span>Min</span>
            <Input
              type="number"
              {...control.register("min", {
                setValueAs: (value: string) => Number(value),
              })}
              errors={control.formState.errors.min}
            />
          </>
        )}
        {questionType == "date" && (
          <>
            <span>Max</span>
            <Input
              type="date"
              {...control.register("max")}
              errors={control.formState.errors.max}
            />
            <span>Min</span>
            <Input
              type="date"
              {...control.register("min")}
              errors={control.formState.errors.min}
            />
          </>
        )}
        {(questionType == "numeric" || questionType == "date") && (
          <>
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

        {questionType == "multiple_choice" && (
          <>
            <span>Multiple Choice (separate by ,)</span>
            <Input
              type="text"
              onChange={(event) => {
                const options = String(event.target.value)
                  .split(",")
                  .map((option) => option.trim());
                control.setValue("options", options);
              }}
              errors={control.formState.errors.options}
            />
          </>
        )}

        {questionType == "conditional" && (
          <>
            <span>Condition (must be an id)</span>
            <Input
              type="number"
              {...control.register("max", {
                setValueAs: (value: string) => Number(value),
              })}
              errors={control.formState.errors.max}
            />
            <span>Condition Child (must be an id)</span>
            <Input
              type="number"
              {...control.register("min", {
                setValueAs: (value: string) => Number(value),
              })}
              errors={control.formState.errors.min}
            />
          </>
        )}

        {questionType == "group" && (
          <>
            <span>Questions in group (list of ids)</span>
            <Input
              type="text"
              onChange={(event) => {
                const options = String(event.target.value)
                  .split(",")
                  .map((option) => option.trim());
                control.setValue("options", options);
              }}
              errors={control.formState.errors.options}
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
