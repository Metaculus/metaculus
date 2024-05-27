import axios from "axios";

import { NumericChartDataset } from "@/types/charts";

export const getQuestionData = async (
  id: number
): Promise<NumericChartDataset> => {
  try {
    const response = await axios.get(`http://localhost:8000/questions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching question data:", error);
    throw error;
  }
};
