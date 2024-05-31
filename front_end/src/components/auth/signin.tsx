"use client";

import { FC } from "react";

import SocialButtons from "@/components/auth/social_buttons";

const SigninComponent: FC = () => {
  return (
    <div>
      <h2 className="mb-4	mr-3 mt-0 text-2xl text-metac-blue-900 dark:text-metac-blue-900-dark">
        Log In
      </h2>
      <p className="mb-6 mt-3 text-base leading-tight">
        Don&apos;t have an account yet?
        <button className="inline-flex items-center justify-center gap-2 rounded-full text-base font-medium leading-tight text-metac-blue-800 underline hover:text-metac-blue-900 active:text-metac-blue-700 disabled:text-metac-blue-800 disabled:opacity-30 dark:text-metac-blue-800-dark dark:hover:text-metac-blue-900-dark dark:active:text-metac-blue-700-dark disabled:dark:text-metac-blue-800-dark">
          Sign Up
        </button>
      </p>
      <form>
        <input
          autoComplete="username"
          className="block w-full rounded border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
          type="text"
          placeholder="username or email"
          name="username"
        />
        <div className="text-xs text-metac-red-500 dark:text-metac-red-500-dark"></div>
        <input
          autoComplete="current-password"
          className="mt-4 block w-full rounded border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
          type="password"
          placeholder="password"
          name="password"
        />
        <div className="text-xs text-metac-red-500 dark:text-metac-red-500-dark"></div>
        <button
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-metac-blue-900 bg-metac-blue-900 px-3 py-2 text-sm font-medium leading-none text-metac-gray-200 no-underline hover:border-metac-blue-800 hover:bg-metac-blue-800 active:border-metac-gray-800 active:bg-metac-gray-800 disabled:border-metac-blue-900 disabled:bg-metac-blue-900 disabled:opacity-30 dark:border-metac-blue-900-dark dark:bg-metac-blue-900-dark dark:text-metac-gray-200-dark dark:hover:border-metac-blue-800-dark dark:hover:bg-metac-blue-800-dark dark:active:border-metac-gray-800-dark dark:active:bg-metac-gray-800-dark disabled:dark:border-metac-blue-900-dark disabled:dark:bg-metac-blue-900-dark"
          type="submit"
        >
          Log in
        </button>
      </form>
      <button className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm font-medium leading-none text-metac-blue-800 no-underline hover:text-metac-blue-900 active:text-metac-blue-700 disabled:text-metac-blue-800 disabled:opacity-30 dark:text-metac-blue-800-dark dark:hover:text-metac-blue-900-dark dark:active:text-metac-blue-700-dark disabled:dark:text-metac-blue-800-dark">
        Forgot Password?
      </button>
      <hr className="my-3 border-metac-gray-300 dark:border-metac-gray-300-dark" />
      <SocialButtons />
    </div>
  );
};

export default SigninComponent;
