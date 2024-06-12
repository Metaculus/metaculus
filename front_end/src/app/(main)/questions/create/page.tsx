import React, { useState } from "react";

const QuestionForm = () => {
  const [formData, setFormData] = useState({
    access: "public",
    questionType: "binary",
    question: "",
    title: "",
    backgroundInformation: "",
    resolutionCriteria: "",
    finePrint: "",
    closingDate: "",
    resolveDate: "",
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log(formData);
    // Process the data here or send it to an API
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Access
        <select name="access" value={formData.access} onChange={handleChange}>
          <option value="public">public</option>
          <option value="private">private</option>
        </select>
      </label>
      <label>
        Question Type
        <select
          name="questionType"
          value={formData.questionType}
          onChange={handleChange}
        >
          <option value="binary">binary</option>
          <option value="multiple">multiple choice</option>
        </select>
      </label>
      <label>
        Question
        <input
          type="text"
          name="question"
          value={formData.question}
          onChange={handleChange}
        />
      </label>
      <label>
        Title
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </label>
      <label>
        Background Information
        <textarea
          name="backgroundInformation"
          value={formData.backgroundInformation}
          onChange={handleChange}
        />
      </label>
      <label>
        Resolution Criteria
        <textarea
          name="resolutionCriteria"
          value={formData.resolutionCriteria}
          onChange={handleChange}
        />
      </label>
      <label>
        Fine Print
        <textarea
          name="finePrint"
          value={formData.finePrint}
          onChange={handleChange}
        />
      </label>
      <label>
        Closing Date
        <input
          type="datetime-local"
          name="closingDate"
          value={formData.closingDate}
          onChange={handleChange}
        />
      </label>
      <label>
        Resolve Date
        <input
          type="datetime-local"
          name="resolveDate"
          value={formData.resolveDate}
          onChange={handleChange}
        />
      </label>
      <button type="submit">Save</button>
    </form>
  );
};

export default QuestionForm;
