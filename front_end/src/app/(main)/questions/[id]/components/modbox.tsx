import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";

export default async function Modbox({ post }: { post: PostWithForecasts }) {
  const { user } = useAuth();

  return (
    <div>
      <button>Send Back Draft</button>
      <button>Approve</button>
    </div>
  );
}
