"use client";

import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";

import { approvePost, draftPost } from "../../actions";

export default async function Modbox({ post }: { post: PostWithForecasts }) {
  const { user } = useAuth();

  return (
    <div className="mb-2 mt-2 flex flex-row items-center gap-4">
      <button
        className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
        onClick={async () => {
          await draftPost(post.id);
        }}
      >
        Send Back Draft
      </button>
      <button
        className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
        onClick={async () => {
          await approvePost(post.id);
        }}
      >
        Approve
      </button>
      <button className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark">
        <a href={`/questions/edit/${post.id}`}>Edit</a>
      </button>
    </div>
  );
}
