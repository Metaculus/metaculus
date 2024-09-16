import { useRouter } from "next/router"; // Make sure this matches your Next.js version

import AggregationExplorerAPI from "@/services/aggregation_explorer";

export default function AggregationExplorer() {
  const router = useRouter();

  const [questionId, setQuestionId] = useState<string>("");
  const [includeBots, setIncludeBots] = useState<boolean>(false);
  const [data, setData] = useState<any>(null); // State to hold fetched data
  const [loading, setLoading] = useState<boolean>(false); // State to handle loading state
  const [error, setError] = useState<string | null>(null); // State to handle errors

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const questionIdParam = urlParams.get("question_id");
    const includeBotsParam = urlParams.get("include_bots");

    if (questionIdParam) {
      setQuestionId(questionIdParam);
    }
    if (includeBotsParam) {
      setIncludeBots(includeBotsParam === "true");
    }

    // If parameters exist, trigger data fetch
    if (questionIdParam || includeBotsParam) {
      fetchData(questionIdParam, includeBotsParam === "true");
    }
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construct the query params
    const params = new URLSearchParams({
      question_id: questionId,
      include_bots: includeBots.toString(),
    });

    // Update the URL without reloading the page
    router.push(`/aggregation_explorer/?${params.toString()}`, undefined, {
      shallow: true,
    });

    // Trigger data fetch with updated parameters
    fetchData(questionId, includeBots);
  };

  // Fetch data function (updated to handle async and state)
  const fetchData = async (questionId: string, includeBots: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AggregationExplorerAPI.getAggregations({
        questionId,
        includeBots,
      });
      setData(response);
      console.log("Fetched data:", response);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Question ID:
            <input
              type="number"
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Include Bots:
            <input
              type="checkbox"
              checked={includeBots}
              onChange={(e) => setIncludeBots(e.target.checked)}
            />
          </label>
        </div>
        <button type="submit">Submit</button>
      </form>

      {/* Display loading, error, and fetched data */}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
