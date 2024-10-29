"use client";

import { useEffect, useState } from "react";
import React from "react";

import { PostWithForecasts } from "@/types/post";

import { getPost } from "../api-actions";

// TODO:
// - Make this look pretty
// - Add scroll bars
// - Figure out if there is a more direct way to get aggregation information (its a train wreck to get prediction)
// - Get it to stop randomly reloading

const ForecastOverview = ({ questionIds }: { questionIds: number[] }) => {
  const [questionPosts, setQuestionPosts] = useState<PostWithForecasts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Create an array of promises for all questions at once
        const promises = questionIds.map((id) => getPost(id));
        
        // Start loading all questions in parallel
        const fetchedQuestions = await Promise.all(promises);
        
        setQuestionPosts(fetchedQuestions);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [questionIds]);

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold">Thank you! 🎉</h2>
      <h3 className="mb-4 text-xl font-semibold">Your forecasts</h3>
      {isLoading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm">
              <th className="pb-2 font-normal">Question</th>
              <th className="pb-2 text-right font-normal">Community says</th>
              <th className="pb-2 text-right font-normal">You said</th>
            </tr>
          </thead>
          <tbody>
            {questionPosts.map((post) => {
              const communityPrediction =
                post.question?.aggregations.recency_weighted.latest
                  ?.centers?.[0];
              const userPrediction =
                post.question?.my_forecasts?.latest?.forecast_values[1];

              return (
                <tr key={post.id} className="border-b">
                  <td className="py-3 pr-4">{post.title}</td>
                  <td className="py-3 pr-4 text-right">
                    {communityPrediction
                      ? `${(communityPrediction * 100).toFixed(0)}%`
                      : "N/A"}
                  </td>
                  <td className="py-3 text-right">
                    {userPrediction
                      ? `${(userPrediction * 100).toFixed(0)}%`
                      : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ForecastOverview;
