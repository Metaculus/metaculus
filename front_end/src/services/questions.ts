import { Question } from "@/types/question";

export const getQuestionData = async (id: number): Promise<Question> => {
  try {
    const response = await fetch(`http://localhost:8000/questions/${id}/`);
    const data = response.json();
    return data;
  } catch (error) {
    console.error("Error fetching question data:", error);
    throw error;
  }
};
