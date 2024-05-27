import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-24">
      <Link
        href={"/questions"}
        className={"font-bold text-metac-blue-800 hover:opacity-60"}
      >
        Go to Questions
      </Link>
      <Link
        href={"/questions/120"}
        className={"font-bold text-metac-blue-800 hover:opacity-60"}
      >
        Go to question 120
      </Link>
    </main>
  );
}
