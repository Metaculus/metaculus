"use client";

import { useEffect, useState } from "react";
import React from "react";

import { PostWithForecasts } from "@/types/post";

import { getPost } from "@/app/(main)/questions/actions";


const ForecastOverview = ({ questionIds }: { questionIds: number[] }) => {
  const [questionPosts, setQuestionPosts] = useState<PostWithForecasts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      const fetchedQuestions = await Promise.all(
        questionIds.map(async (id) => {
          const post = await getPost(id);
          return post as PostWithForecasts;
        })
      );
      setQuestionPosts(fetchedQuestions);
      setIsLoading(false);
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm">
                <th className="pb-2 font-normal">Question</th>
                <th className="whitespace-nowrap pb-2 pr-4 text-right font-normal">
                  Community says
                </th>
                <th className="whitespace-nowrap pb-2 text-right font-normal">
                  You said
                </th>
              </tr>
            </thead>
            <tbody>
              {questionPosts.map((post, index) => {
                const communityPrediction =
                  post.question?.aggregations.recency_weighted.latest
                    ?.centers?.[0];
                const userPrediction =
                  post.question?.my_forecasts?.latest?.forecast_values[0];

                return (
                  <tr key={index} className="border-b">
                    <td className="py-3 pr-4">{post.title}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right">
                      {communityPrediction
                        ? `${(communityPrediction * 100).toFixed(0)}%`
                        : "N/A"}
                    </td>
                    <td className="whitespace-nowrap py-3 text-right">
                      {userPrediction
                        ? `${(userPrediction * 100).toFixed(0)}%`
                        : "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ForecastOverview;
