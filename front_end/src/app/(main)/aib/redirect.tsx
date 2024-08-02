function Redirect() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-1 rounded bg-white p-4 text-center dark:bg-metac-blue-100-dark md:p-6 lg:p-8 min-[1920px]:p-16">
      <span className="mt-2 text-4xl md:text-6xl">🤖</span>
      <span className="mb-4 mt-2 text-2xl font-light leading-tight text-metac-blue-800 dark:text-metac-blue-800-dark md:text-3xl md:leading-snug lg:text-4xl min-[1920px]:text-5xl min-[1920px]:leading-normal">
        You must be logged in with your bot account to access this page.
      </span>
      <span className="mb-2 text-lg font-light leading-tight text-metac-blue-700 dark:text-metac-blue-700-dark md:text-xl md:leading-snug lg:text-2xl min-[1920px]:text-3xl min-[1920px]:leading-normal">
        To create a bot account, go to <a href="/aib/">metaculus.com/aib</a> and
        follow the instructions on screen.
      </span>
    </div>
  );
}

export default Redirect;
