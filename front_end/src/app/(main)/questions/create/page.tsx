import Link from "next/link";
import "react";

const Creator: React.FC = ({}) => {
  return (
    <div className="flex w-full flex-col p-8">
      <div className="flex max-w-[640px]">
        <h1 className="text-xl">Write</h1>
      </div>
      <div className="flex max-w-[640px]">
        <p>Create a question, notebook, conditional, etc</p>
      </div>
      <div className="flex w-full flex-row justify-center p-8">
        <a
          href="/questions/create/question"
          className="text-l cursor-pointer rounded-l-3xl border border-black bg-white  p-2 text-center text-black no-underline hover:bg-blue-900"
        >
          Single Question
        </a>
        <a
          href="/questions/create/group"
          className="text-l cursor-pointer border border-black bg-white  p-2 text-center text-black no-underline hover:bg-blue-900"
        >
          Question Group
        </a>
        <a
          href="/questions/create/conditional"
          className="text-l cursor-pointer border  border-black bg-white  p-2 text-center text-black no-underline hover:bg-blue-900"
        >
          Conditional Pair
        </a>
        <a
          href="/questions/create/notebook"
          className="text-l cursor-pointer rounded-r-3xl border border-black bg-white  p-2 text-center text-black no-underline hover:bg-blue-900"
        >
          Notebook
        </a>
      </div>
    </div>
  );
};

export default Creator;
